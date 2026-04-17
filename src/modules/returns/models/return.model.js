const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const returnSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, index: true },
    buyerId: { type: String, required: true, index: true },
    reason: { type: String, enum: ["defective", "not_as_described", "changed_mind", "other"], required: true },
    description: String,
    items: [
      {
        productId: String,
        quantity: Number,
        unitPrice: Number,
      },
    ],
    status: {
      type: String,
      enum: ["requested", "approved", "shipped_back", "received", "refunded", "rejected"],
      default: "requested",
      index: true,
    },
    refundAmount: Number,
    trackingNumber: String,
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    refundedAt: Date,
    notes: String,
  },
  { timestamps: true },
);

const ReturnModel = mongoose.model("Return", returnSchema);

module.exports = { ReturnModel };
