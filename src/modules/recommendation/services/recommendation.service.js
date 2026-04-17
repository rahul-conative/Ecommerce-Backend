const { RecommendationModel } = require("../models/recommendation.model");
const {
  setCached,
  getCached,
  deleteCached,
  cacheKeys,
  CACHE_TTL,
} = require("../../../infrastructure/cache/redis-client");

/**
 * Recommendation Engine
 */
class RecommendationService {
  // ==============================
  // Get Recommendations
  // ==============================
  async getRecommendations(userId) {
    const cacheKey = cacheKeys.recommendations(userId);

    let recs = await getCached(cacheKey);

    if (!recs) {
      recs = await RecommendationModel.findOne({ userId }).lean();

      if (!recs) {
        const newDoc = await RecommendationModel.create({
          userId,
          recommendedProducts: [],
          trending: [],
        });

        recs = newDoc.toObject();
      }

      await setCached(cacheKey, recs, CACHE_TTL.RECOMMENDATION);
    }

    return (recs.recommendedProducts || [])
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  // ==============================
  // Add Recommendation
  // ==============================
  async addRecommendation(userId, productId, reason, score = 75) {
    let recs = await RecommendationModel.findOne({ userId });

    if (!recs) {
      recs = new RecommendationModel({
        userId,
        recommendedProducts: [],
      });
    }

    const existing = recs.recommendedProducts.find(
      (r) => r.productId.toString() === productId.toString()
    );

    if (existing) {
      existing.score = Math.max(existing.score, score);
    } else {
      recs.recommendedProducts.push({
        productId,
        score,
        reason,
      });
    }

    // Keep top 100
    recs.recommendedProducts.sort((a, b) => b.score - a.score);
    recs.recommendedProducts = recs.recommendedProducts.slice(0, 100);

    recs.lastUpdated = new Date();

    await recs.save();
    await this.invalidateCache(userId);

    return recs;
  }

  // ==============================
  // Record User Interaction
  // ==============================
  async recordInteraction(userId, productId, interactionType) {
    const recs = await RecommendationModel.findOne({ userId });

    if (!recs) return;

    const product = recs.recommendedProducts.find(
      (r) => r.productId.toString() === productId.toString()
    );

    if (!product) return;

    const now = new Date();

    switch (interactionType) {
      case "clicked":
        product.clickedAt = now;
        product.score += 5;
        break;
      case "purchased":
        product.purchasedAt = now;
        product.score += 20;
        break;
      case "viewed":
        product.score += 1;
        break;
    }

    await recs.save();
    await this.invalidateCache(userId);
  }

  // ==============================
  // Trending Products
  // ==============================
  async getTrendingProducts(category = null, period = "week") {
    const cacheKey = `trending:${category || "all"}:${period}`;

    let trending = await getCached(cacheKey);
    if (trending) return trending;

    // Placeholder (replace with analytics DB / events)
    trending = [];

    await setCached(cacheKey, trending, CACHE_TTL.RECOMMENDATION);

    return trending;
  }

  // ==============================
  // Cache Invalidation
  // ==============================
  async invalidateCache(userId) {
    await deleteCached(cacheKeys.recommendations(userId));
  }
}

module.exports = {
  RecommendationService: new RecommendationService(),
};