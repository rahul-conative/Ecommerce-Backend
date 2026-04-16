const { mongoose } = require("../../infrastructure/mongo/mongo-client");

const domainEventLogSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventName: { type: String, required: true, index: true },
    aggregateId: { type: String, index: true },
    version: { type: Number, required: true },
    source: String,
    payload: { type: Object, default: {} },
    occurredAt: Date,
  },
  { timestamps: true },
);

const DomainEventLogModel = mongoose.model("DomainEventLog", domainEventLogSchema);

module.exports = { DomainEventLogModel };
