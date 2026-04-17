const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const dynamicPricingSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },
    basePriceUSD: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    rules: [
      {
        type: String, // "time_based", "volume_based", "demand_based", "seasonal"
        condition: Object, // e.g., { startTime: Date, endTime: Date }
        priceModifier: Number, // e.g., 0.9 for 10% off
        priority: Number,
        active: Boolean,
      },
    ],
    demandScore: { type: Number, default: 0.5 }, // 0-1, higher = more demand
    lastAdjustedAt: Date,
    priceHistory: [
      {
        price: Number,
        reason: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const DynamicPricingModel = mongoose.model("DynamicPricing", dynamicPricingSchema);

module.exports = { DynamicPricingModel };
