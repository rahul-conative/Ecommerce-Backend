const { eventBus } = require("../events/event-bus");
const { DOMAIN_EVENTS } = require("../../contracts/events/domain-events");
const { emitToOrder, emitToRole, emitToUser } = require("./socket-server");
const { ROLES } = require("../../shared/constants/roles");

let realtimeRegistered = false;

function registerRealtimeSubscribers() {
  if (realtimeRegistered) {
    return;
  }

  realtimeRegistered = true;

  eventBus.subscribe(DOMAIN_EVENTS.ORDER_CREATED_V1, async (event) => {
    emitToUser(event.payload.buyerId, "order:created", event.payload);
    emitToOrder(event.aggregateId, "order:update", event.payload);
  });

  eventBus.subscribe(DOMAIN_EVENTS.ORDER_STATUS_UPDATED_V1, async (event) => {
    emitToUser(event.payload.buyerId, "order:status", event.payload);
    emitToOrder(event.payload.orderId, "order:update", event.payload);
  });

  eventBus.subscribe(DOMAIN_EVENTS.PAYMENT_INITIATED_V1, async (event) => {
    emitToUser(event.payload.buyerId, "payment:initiated", event.payload);
    emitToOrder(event.payload.orderId, "payment:update", event.payload);
  });

  eventBus.subscribe(DOMAIN_EVENTS.PAYMENT_VERIFIED_V1, async (event) => {
    emitToUser(event.payload.buyerId, "payment:verified", event.payload);
    emitToOrder(event.payload.orderId, "payment:update", event.payload);
  });

  eventBus.subscribe(DOMAIN_EVENTS.PAYMENT_FAILED_V1, async (event) => {
    emitToUser(event.payload.buyerId, "payment:failed", event.payload);
    emitToOrder(event.payload.orderId, "payment:update", event.payload);
  });

  eventBus.subscribe(DOMAIN_EVENTS.NOTIFICATION_CREATED_V1, async (event) => {
    emitToUser(event.payload.userId, "notification:new", event.payload);
  });

  eventBus.subscribe(DOMAIN_EVENTS.SELLER_KYC_SUBMITTED_V1, async (event) => {
    emitToUser(event.payload.sellerId, "kyc:submitted", event.payload);
    emitToRole(ROLES.ADMIN, "admin:kyc:update", event.payload);
  });

  eventBus.subscribe(DOMAIN_EVENTS.USER_KYC_SUBMITTED_V1, async (event) => {
    emitToUser(event.payload.userId, "kyc:submitted", event.payload);
    emitToRole(ROLES.ADMIN, "admin:kyc:update", event.payload);
  });

  eventBus.subscribe(DOMAIN_EVENTS.KYC_STATUS_UPDATED_V1, async (event) => {
    const targetUserId = event.payload.userId || event.payload.sellerId;
    emitToUser(targetUserId, "kyc:status", event.payload);
    emitToRole(ROLES.ADMIN, "admin:kyc:update", event.payload);
  });
}

module.exports = { registerRealtimeSubscribers };
