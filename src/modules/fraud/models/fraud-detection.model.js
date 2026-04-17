const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const fraudDetectionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, index: true },
    buyerId: { type: String, required: true, index: true },
    riskScore: { type: Number, required: true, min: 0, max: 100 }, // 0-100
    riskLevel: { type: String, enum: ["low", "medium", "high", "critical"], required: true, index: true },
    indicators: [
      {
        type: String, // "high_transaction_value", "international_shipping", "new_card", "velocity", "ip_mismatch", "card_mismatch"
        severity: String, // "low", "medium", "high"
        description: String,
      },
    ],
    action: { type: String, enum: ["allow", "review", "block"], default: "allow" },
    reviewStatus: { type: String, enum: ["pending", "approved", "rejected"] },
    reviewedBy: String,
    reviewNotes: String,
    reviewedAt: Date,
    falsePositive: Boolean,
  },
  { timestamps: true },
);

const FraudDetectionModel = mongoose.model("FraudDetection", fraudDetectionSchema);

module.exports = { FraudDetectionModel };
