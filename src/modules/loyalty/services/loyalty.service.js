const { LoyaltyModel } = require("../models/loyalty.model");
const { setCached, getCached, deleteCached, cacheKeys, CACHE_TTL } = require("../../../infrastructure/cache/redis-client");
const { AppError } = require("../../../shared/errors/app-error");

/**
 * Loyalty & Points System
 * Tiers: bronze, silver, gold, platinum
 * Points earned: purchase (1 point per $1), referral, birthday, tier rewards
 */

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000,
};

const POINTS_CONFIG = {
  purchase: 1, // 1 point per $1 spent
  referral: 500, // referral bonus
  birthday: 100,
  tierUpgrade: 250, // bonus on tier upgrade
};

class LoyaltyService {
  async getOrCreateLoyalty(userId) {
    const cacheKey = cacheKeys.userProfile(userId);
    let loyalty = await getCached(cacheKey);

    if (loyalty) {
      loyalty = LoyaltyModel.hydrate(loyalty);
    }

    if (!loyalty) {
      loyalty = await LoyaltyModel.findOne({ userId });
      if (!loyalty) {
        loyalty = new LoyaltyModel({ userId, totalPoints: 0, tier: "bronze" });
        await loyalty.save();
      }
      await setCached(cacheKey, loyalty.toObject(), CACHE_TTL.USER);
    }

    return loyalty;
  }

  async addPoints(userId, points, reason, expiresAt = null, transactionId = null) {
    const loyalty = await this.getOrCreateLoyalty(userId);

    const pointRecord = {
      transactionId,
      points,
      reason,
      expiresAt,
      createdAt: new Date(),
    };

    loyalty.pointsHistory.push(pointRecord);
    loyalty.totalPoints += points;

    const newTier = this.calculateTier(loyalty.totalPoints);
    if (newTier !== loyalty.tier) {
      await this.upgradeTier(loyalty, newTier);
    }

    await loyalty.save();
    await this.invalidateCache(userId);

    return loyalty;
  }

  async redeemPoints(userId, points) {
    const loyalty = await this.getOrCreateLoyalty(userId);

    if (loyalty.totalPoints < points) {
      throw new AppError("Insufficient loyalty points", 400);
    }

    loyalty.totalPoints -= points;
    loyalty.pointsHistory.push({
      points: -points,
      reason: "redemption",
      createdAt: new Date(),
    });

    await loyalty.save();
    await this.invalidateCache(userId);

    return loyalty;
  }

  async getPointsHistory(userId, { limit = 50, offset = 0 } = {}) {
    const loyalty = await this.getOrCreateLoyalty(userId);
    return loyalty.pointsHistory
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + limit);
  }

  calculateTier(totalPoints) {
    if (totalPoints >= TIER_THRESHOLDS.platinum) return "platinum";
    if (totalPoints >= TIER_THRESHOLDS.gold) return "gold";
    if (totalPoints >= TIER_THRESHOLDS.silver) return "silver";
    return "bronze";
  }

  async upgradeTier(loyalty, newTier) {
    loyalty.tier = newTier;
    loyalty.tierHistory.push({
      tier: newTier,
      since: new Date(),
      pointsRequired: TIER_THRESHOLDS[newTier],
    });

    loyalty.pointsHistory.push({
      points: POINTS_CONFIG.tierUpgrade,
      reason: `tier_upgrade:${newTier}`,
      createdAt: new Date(),
    });
    loyalty.totalPoints += POINTS_CONFIG.tierUpgrade;
  }

  async getTierBenefits(tier) {
    const benefits = {
      bronze: { discount: 0, freeShipping: false, prioritySupport: false },
      silver: { discount: 0.05, freeShipping: false, prioritySupport: false },
      gold: { discount: 0.1, freeShipping: true, prioritySupport: false },
      platinum: { discount: 0.15, freeShipping: true, prioritySupport: true },
    };

    return benefits[tier] || benefits.bronze;
  }

  async invalidateCache(userId) {
    await deleteCached(cacheKeys.userProfile(userId));
  }
}

module.exports = { LoyaltyService: new LoyaltyService() };
