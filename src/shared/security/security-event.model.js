const { mongoose } = require("../../infrastructure/mongo/mongo-client");

const securityEventSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true, index: true },
    outcome: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    email: { type: String, index: true },
    provider: { type: String, index: true },
    ipAddress: String,
    userAgent: String,
    requestId: String,
    platform: String,
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

const SecurityEventModel = mongoose.model("SecurityEvent", securityEventSchema);

module.exports = { SecurityEventModel };
