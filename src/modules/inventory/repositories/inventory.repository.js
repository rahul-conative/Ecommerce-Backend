const { ProductRepository } = require("../../product/repositories/product.repository");
const { InventoryReservationModel } = require("../models/inventory-reservation.model");

class InventoryRepository {
  constructor({ productRepository = new ProductRepository() } = {}) {
    this.productRepository = productRepository;
  }

  async reserveItems(orderId, buyerId, items) {
    const reservedProducts = [];

    try {
      for (const item of items) {
        const updatedProduct = await this.productRepository.reserveStock(item.productId, item.quantity);
        if (!updatedProduct) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        reservedProducts.push(item);
      }

      return InventoryReservationModel.findOneAndUpdate(
        { orderId },
        {
          $set: {
            buyerId,
            status: "reserved",
            items,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      await Promise.all(
        reservedProducts.map((item) =>
          this.productRepository.releaseReservedStock(item.productId, item.quantity),
        ),
      );
      throw error;
    }
  }

  async findReservationByOrderId(orderId) {
    return InventoryReservationModel.findOne({ orderId });
  }

  async releaseReservation(orderId) {
    const reservation = await InventoryReservationModel.findOne({ orderId });
    if (!reservation || reservation.status !== "reserved") {
      return reservation;
    }

    await Promise.all(
      reservation.items.map((item) =>
        this.productRepository.releaseReservedStock(item.productId, item.quantity),
      ),
    );

    reservation.status = "released";
    await reservation.save();
    return reservation;
  }

  async commitReservation(orderId) {
    const reservation = await InventoryReservationModel.findOne({ orderId });
    if (!reservation || reservation.status !== "reserved") {
      return reservation;
    }

    await Promise.all(
      reservation.items.map((item) =>
        this.productRepository.commitReservedStock(item.productId, item.quantity),
      ),
    );

    reservation.status = "committed";
    await reservation.save();
    return reservation;
  }

  async restockReservation(orderId) {
    const reservation = await InventoryReservationModel.findOne({ orderId });
    if (!reservation || reservation.status !== "committed") {
      return reservation;
    }

    await Promise.all(
      reservation.items.map((item) => this.productRepository.addStock(item.productId, item.quantity)),
    );

    reservation.status = "restocked";
    await reservation.save();
    return reservation;
  }
}

module.exports = { InventoryRepository };
