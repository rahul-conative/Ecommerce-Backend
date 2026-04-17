const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const loyaltySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    totalPoints: { type: Number, default: 0 },
    tier: { type: String, enum: ["bronze", "silver", "gold", "platinum"], default: "bronze", index: true },
    pointsHistory: [
      {
        transactionId: String,
        points: Number,
        reason: String, // "purchase", "referral", "birthday", "loyalty_tier"
        expiresAt: Date,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tierHistory: [
      {
        tier: String,
        since: { type: Date, default: Date.now },
        pointsRequired: Number,
      },
    ],
    lastPointsResetAt: Date,
    totalSpent: { type: Number, default: 0 },
  },
  { timestamps: true },
);

loyaltySchema.index({ totalPoints: -1 }); // For leaderboards

const LoyaltyModel = mongoose.model("Loyalty", loyaltySchema);

module.exports = { LoyaltyModel };
