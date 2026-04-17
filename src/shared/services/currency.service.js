/**
 * Multi-Currency Service (PRODUCTION READY)
 */

const { logger } = require("../logger/logger");

const CURRENCY_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.12,
  JPY: 149.5,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  CNY: 7.24,
  AED: 3.67,
};

const TAX_RATES = {
  US: 0.07,
  EU: 0.21,
  IN: 0.18,
  UK: 0.2,
  CA: 0.15,
  AU: 0.1,
  JP: 0.1,
  default: 0,
};

class CurrencyService {
  // ==============================
  // Safe rounding
  // ==============================
  round(value, currency = "USD") {
    const precision = currency === "JPY" ? 0 : 2; // JPY has no decimals
    return Number(value.toFixed(precision));
  }

  // ==============================
  // Convert currency
  // ==============================
  convertCurrency(amount, fromCurrency, toCurrency) {
    if (!amount || amount < 0) {
      throw new Error("Invalid amount");
    }

    if (fromCurrency === toCurrency) {
      return this.round(amount, toCurrency);
    }

    const rateFrom = CURRENCY_RATES[fromCurrency];
    const rateTo = CURRENCY_RATES[toCurrency];

    if (!rateFrom || !rateTo) {
      throw new Error(`Unsupported currency: ${fromCurrency} → ${toCurrency}`);
    }

    const usdAmount = amount / rateFrom;
    const converted = usdAmount * rateTo;

    return this.round(converted, toCurrency);
  }

  // ==============================
  // Get local price with tax
  // ==============================
  getLocalPrice({
    basePrice,
    baseCurrency = "USD",
    targetCurrency = "USD",
    country = "default",
  }) {
    if (!basePrice || basePrice < 0) {
      throw new Error("Invalid base price");
    }

    const convertedPrice = this.convertCurrency(
      basePrice,
      baseCurrency,
      targetCurrency
    );

    const taxRate = TAX_RATES[country] ?? TAX_RATES.default;

    const taxAmount = this.round(convertedPrice * taxRate, targetCurrency);
    const totalPrice = this.round(convertedPrice + taxAmount, targetCurrency);

    return {
      basePrice: convertedPrice,
      currency: targetCurrency,
      taxRate,
      taxAmount,
      totalPrice,
      country,
    };
  }

  // ==============================
  // Calculate tax separately
  // ==============================
  calculateTax(amount, country, currency = "USD") {
    if (!amount || amount < 0) {
      throw new Error("Invalid amount");
    }

    const taxRate = TAX_RATES[country] ?? TAX_RATES.default;
    return this.round(amount * taxRate, currency);
  }

  // ==============================
  // Format currency (UI ready)
  // ==============================
  format(amount, currency = "USD", locale = "en-US") {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
      }).format(amount);
    } catch (err) {
      logger.warn({ err, currency }, "Currency format failed");
      return `${amount} ${currency}`;
    }
  }

  // ==============================
  // Supported configs
  // ==============================
  getSupportedCountries() {
    return Object.keys(TAX_RATES).filter((c) => c !== "default");
  }

  getSupportedCurrencies() {
    return Object.keys(CURRENCY_RATES);
  }
}

module.exports = {
  CurrencyService: new CurrencyService(),
};