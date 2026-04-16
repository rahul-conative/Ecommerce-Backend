const { DomainEventLogModel } = require("./domain-event-log.model");

class DomainEventLogService {
  async record(event) {
    return DomainEventLogModel.findOneAndUpdate(
      { eventId: event.id },
      {
        $setOnInsert: {
          eventId: event.id,
          eventName: event.eventName,
          aggregateId: event.aggregateId || null,
          version: event.version,
          source: event.source,
          payload: event.payload,
          occurredAt: new Date(event.occurredAt),
        },
      },
      { upsert: true, new: true },
    );
  }
}

const domainEventLogService = new DomainEventLogService();

module.exports = { DomainEventLogService, domainEventLogService };
