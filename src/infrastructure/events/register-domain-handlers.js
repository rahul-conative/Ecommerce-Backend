const { eventBus } = require("./event-bus");
const { DOMAIN_EVENTS } = require("../../contracts/events/domain-events");
const { OrderRepository } = require("../../modules/order/repositories/order.repository");
const { ORDER_STATUS } = require("../../shared/domain/commerce-constants");
const { InventoryService } = require("../../modules/inventory/services/inventory.service");
const { WalletService } = require("../../modules/wallet/services/wallet.service");

let handlersRegistered = false;

function registerDomainHandlers() {
  if (handlersRegistered) {
    return;
  }

  handlersRegistered = true;
  const orderRepository = new OrderRepository();
  const inventoryService = new InventoryService();
  const walletService = new WalletService();

  eventBus.subscribe(DOMAIN_EVENTS.PAYMENT_VERIFIED_V1, async (event) => {
    await inventoryService.commitForOrder(event.payload.orderId);
    await walletService.capture(event.payload.buyerId, event.payload.orderId);
    await orderRepository.updateStatus(event.payload.orderId, ORDER_STATUS.CONFIRMED);
  });

  eventBus.subscribe(DOMAIN_EVENTS.PAYMENT_FAILED_V1, async (event) => {
    await inventoryService.releaseForOrder(event.payload.orderId);
    await walletService.release(event.payload.buyerId, event.payload.orderId);
    await orderRepository.updateStatus(event.payload.orderId, ORDER_STATUS.PAYMENT_FAILED);
  });
}

module.exports = { registerDomainHandlers };
