const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    recommendedProducts: [
      {
        productId: { type: String, required: true },
        score: { type: Number, required: true }, // 0-100 relevance score
        reason: String, // "popular_with_your_cohort", "frequently_bought_together", "trending", "similar_to_viewed"
        clickedAt: Date,
        purchasedAt: Date,
      },
    ],
    trending: [
      {
        productId: String,
        category: String,
        trendScore: Number,
        period: String, // "today", "week", "month"
      },
    ],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const RecommendationModel = mongoose.model("Recommendation", recommendationSchema);

module.exports = { RecommendationModel };
