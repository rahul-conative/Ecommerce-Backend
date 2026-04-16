const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const analyticsSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true, index: true },
    actorId: { type: String, index: true },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

const AnalyticsModel = mongoose.model("Analytics", analyticsSchema);

module.exports = { AnalyticsModel };
