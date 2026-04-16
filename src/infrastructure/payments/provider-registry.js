const { PAYMENT_PROVIDER } = require("../../shared/domain/commerce-constants");
const { RazorpayProvider } = require("./providers/razorpay.provider");
const { AppError } = require("../../shared/errors/app-error");

class PaymentProviderRegistry {
  constructor() {
    this.providers = {
      [PAYMENT_PROVIDER.RAZORPAY]: new RazorpayProvider(),
    };
  }

  get(providerName) {
    const provider = this.providers[providerName];
    if (!provider) {
      throw new AppError(`Payment provider '${providerName}' is not supported`, 400);
    }

    return provider;
  }
}

const paymentProviderRegistry = new PaymentProviderRegistry();

module.exports = { PaymentProviderRegistry, paymentProviderRegistry };
