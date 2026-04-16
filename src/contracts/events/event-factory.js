const { v4: uuidv4 } = require("uuid");

function buildDomainEvent(eventName, payload, meta = {}) {
  return {
    id: uuidv4(),
    eventName,
    version: 1,
    occurredAt: new Date().toISOString(),
    source: meta.source || "monolith",
    aggregateId: meta.aggregateId || null,
    payload,
  };
}

module.exports = { buildDomainEvent };
