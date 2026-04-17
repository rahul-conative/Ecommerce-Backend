const { DynamicPricingModel } = require("../models/dynamic-pricing.model");
const {
  setCached,
  getCached,
  deleteCached,
  cacheKeys,
  CACHE_TTL,
} = require("../../../infrastructure/cache/redis-client");
const { logger } = require("../../../shared/logger/logger");

/**
 * Dynamic Pricing Engine
 */
class DynamicPricingService {
  // ==============================
  // Get Final Price
  // ==============================
  async getPriceForProduct(productId, userTier = "standard", quantity = 1) {
    const cacheKey = cacheKeys.product(productId);

    let pricing = await getCached(cacheKey);

    if (!pricing) {
      pricing = await DynamicPricingModel.findOne({ productId }).lean();

      if (pricing) {
        await setCached(cacheKey, pricing, CACHE_TTL.PRODUCT);
      }
    }

    if (!pricing) return null;

    let finalPrice = pricing.currentPrice;

    // ==============================
    // Loyalty Discount
    // ==============================
    const loyaltyDiscounts = {
      standard: 0,
      bronze: 0,
      silver: 0.05,
      gold: 0.1,
      platinum: 0.15,
    };

    const discount = loyaltyDiscounts[userTier] || 0;
    finalPrice *= (1 - discount);

    // ==============================
    // Volume Discount
    // ==============================
    if (quantity >= 20) finalPrice *= 0.85;
    else if (quantity >= 10) finalPrice *= 0.9;
    else if (quantity >= 5) finalPrice *= 0.95;

    // ==============================
    // Demand-based pricing (if exists)
    // ==============================
    if (pricing.demandScore) {
      finalPrice = await this.calculateDynamicPrice(
        productId,
        finalPrice,
        pricing.demandScore
      );
    }

    return this.roundPrice(finalPrice);
  }

  // ==============================
  // Admin Price Adjustment
  // ==============================
  async adjustPrice(productId, newPrice, reason) {
    if (newPrice <= 0) {
      throw new Error("Invalid price");
    }

    const pricing = await DynamicPricingModel.findOne({ productId });

    if (!pricing) {
      throw new Error(`Product pricing not found: ${productId}`);
    }

    pricing.currentPrice = newPrice;
    pricing.lastAdjustedAt = new Date();

    pricing.priceHistory = pricing.priceHistory || [];
    pricing.priceHistory.push({
      price: newPrice,
      reason,
      timestamp: new Date(),
    });

    await pricing.save();
    await this.invalidateCache(productId);

    logger.info({ productId, newPrice, reason }, "Price adjusted");

    return pricing;
  }

  // ==============================
  // Apply Pricing Rule
  // ==============================
  async applyRule(productId, rule) {
    const pricing = await DynamicPricingModel.findOne({ productId });

    if (!pricing) {
      throw new Error(`Product pricing not found: ${productId}`);
    }

    pricing.rules = pricing.rules || [];
    pricing.rules.push({ ...rule, active: true });

    // sort by priority (low → high)
    pricing.rules.sort((a, b) => a.priority - b.priority);

    await pricing.save();
    await this.invalidateCache(productId);

    return pricing;
  }

  // ==============================
  // Update Demand Score
  // ==============================
  async updateDemandScore(productId, views = 0, cartAdds = 0, purchases = 0) {
    const pricing = await DynamicPricingModel.findOne({ productId });

    if (!pricing) {
      throw new Error(`Product pricing not found: ${productId}`);
    }

    const safeViews = views || 1;
    const conversionRate = purchases / safeViews;

    // Normalize between 0–1
    pricing.demandScore = Math.min(1, conversionRate * 10);

    await pricing.save();

    return pricing;
  }

  // ==============================
  // Dynamic Price Calculation
  // ==============================
  async calculateDynamicPrice(productId, basePrice, demandScore) {
    const multiplier = 0.9 + demandScore * 0.3; // 0.9 → 1.2
    return basePrice * multiplier;
  }

  // ==============================
  // Cache Invalidation
  // ==============================
  async invalidateCache(productId) {
    const cacheKey = cacheKeys.product(productId);
    await deleteCached(cacheKey);
  }

  // ==============================
  // Helper: Round Price
  // ==============================
  roundPrice(price) {
    return Math.round(price * 100) / 100;
  }
}

module.exports = {
  DynamicPricingService: new DynamicPricingService(),
};