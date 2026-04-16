const { logger } = require("../../shared/logger/logger");

class InMemoryEventBus {
  constructor() {
    this.handlers = new Map();
  }

  subscribe(eventName, handler) {
    const currentHandlers = this.handlers.get(eventName) || [];
    currentHandlers.push(handler);
    this.handlers.set(eventName, currentHandlers);
  }

  async publish(eventName, payload) {
    const handlers = this.handlers.get(eventName) || [];
    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(payload);
        } catch (error) {
          logger.error({ err: error, eventName }, "Event handler failed");
        }
      }),
    );
  }
}

const eventBus = new InMemoryEventBus();

module.exports = { eventBus };
