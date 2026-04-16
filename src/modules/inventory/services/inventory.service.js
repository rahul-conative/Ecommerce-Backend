const { AppError } = require("../../../shared/errors/app-error");
const { buildDomainEvent } = require("../../../contracts/events/event-factory");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { eventPublisher } = require("../../../infrastructure/events/event-publisher");
const { InventoryRepository } = require("../repositories/inventory.repository");

class InventoryService {
  constructor({ inventoryRepository = new InventoryRepository() } = {}) {
    this.inventoryRepository = inventoryRepository;
  }

  async reserveForOrder(orderId, buyerId, items) {
    try {
      const reservation = await this.inventoryRepository.reserveItems(orderId, buyerId, items);
      await eventPublisher.publish(
        buildDomainEvent(
          DOMAIN_EVENTS.INVENTORY_RESERVED_V1,
          { orderId, buyerId, itemCount: items.length },
          { source: "inventory-module", aggregateId: orderId },
        ),
      );
      return reservation;
    } catch (error) {
      throw new AppError(error.message || "Unable to reserve inventory", 409);
    }
  }

  async releaseForOrder(orderId) {
    const reservation = await this.inventoryRepository.releaseReservation(orderId);
    if (reservation) {
      await eventPublisher.publish(
        buildDomainEvent(
          DOMAIN_EVENTS.INVENTORY_RELEASED_V1,
          { orderId, buyerId: reservation.buyerId, itemCount: reservation.items.length },
          { source: "inventory-module", aggregateId: orderId },
        ),
      );
    }

    return reservation;
  }

  async commitForOrder(orderId) {
    const reservation = await this.inventoryRepository.commitReservation(orderId);
    if (reservation) {
      await eventPublisher.publish(
        buildDomainEvent(
          DOMAIN_EVENTS.INVENTORY_COMMITTED_V1,
          { orderId, buyerId: reservation.buyerId, itemCount: reservation.items.length },
          { source: "inventory-module", aggregateId: orderId },
        ),
      );
    }

    return reservation;
  }

  async restockForOrder(orderId) {
    return this.inventoryRepository.restockReservation(orderId);
  }
}

module.exports = { InventoryService };
