const { AnalyticsRepository } = require("../repositories/analytics.repository");
const { eventBus } = require("../../../infrastructure/events/event-bus");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");

let subscribersRegistered = false;

class AnalyticsService {
  constructor({ analyticsRepository = new AnalyticsRepository() } = {}) {
    this.analyticsRepository = analyticsRepository;
    this.registerSubscribers();
  }

  registerSubscribers() {
    if (subscribersRegistered) {
      return;
    }

    subscribersRegistered = true;

    eventBus.subscribe(DOMAIN_EVENTS.ORDER_CREATED_V1, async (event) => {
      await this.analyticsRepository.create({
        eventName: DOMAIN_EVENTS.ORDER_CREATED_V1,
        actorId: event.payload.buyerId,
        metadata: event.payload,
      });
    });

    eventBus.subscribe(DOMAIN_EVENTS.PAYMENT_INITIATED_V1, async (event) => {
      await this.analyticsRepository.create({
        eventName: DOMAIN_EVENTS.PAYMENT_INITIATED_V1,
        actorId: event.payload.buyerId,
        metadata: event.payload,
      });
    });
  }

  async track(payload) {
    return this.analyticsRepository.create(payload);
  }

  async listEvents() {
    return this.analyticsRepository.list();
  }
}

module.exports = { AnalyticsService };
