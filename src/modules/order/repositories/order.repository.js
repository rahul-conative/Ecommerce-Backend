const { knex } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");
const { OutboxRepository } = require("../../../infrastructure/postgres/outbox.repository");

class OrderRepository {
  constructor({ outboxRepository = new OutboxRepository() } = {}) {
    this.outboxRepository = outboxRepository;
  }

  async createOrder(payload, event) {
    const orderId = payload.id || uuidv4();
    const trx = await knex.transaction();

    try {
      await trx("orders").insert({
        id: orderId,
        buyer_id: payload.buyerId,
        status: payload.status,
        currency: payload.currency,
        subtotal_amount: payload.subtotalAmount,
        discount_amount: payload.discountAmount,
        tax_amount: payload.taxAmount,
        total_amount: payload.totalAmount,
        shipping_address: JSON.stringify(payload.shippingAddress),
        coupon_code: payload.couponCode || null,
        wallet_discount_amount: payload.walletDiscountAmount || 0,
        payable_amount: payload.payableAmount || payload.totalAmount,
        tax_breakup: JSON.stringify(payload.taxBreakup || {}),
      });

      const items = payload.items.map((item) => ({
        id: uuidv4(),
        order_id: orderId,
        product_id: item.productId,
        seller_id: item.sellerId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        line_total: item.lineTotal,
      }));

      await trx("order_items").insert(items);

      if (event) {
        await this.outboxRepository.enqueue(trx, {
          ...event,
          aggregateId: orderId,
        });
      }

      await trx.commit();
      return { id: orderId, ...payload };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async listOrdersByBuyer(buyerId) {
    return knex("orders").where("buyer_id", buyerId).orderBy("created_at", "desc");
  }

  async updateStatus(orderId, status) {
    const [order] = await knex("orders")
      .where("id", orderId)
      .update({ status })
      .returning("*");
    return order || null;
  }

  async findById(orderId) {
    const [order] = await knex("orders").where("id", orderId).limit(1);
    return order || null;
  }

  async findByIdAndBuyer(orderId, buyerId) {
    const [order] = await knex("orders")
      .where({ id: orderId, buyer_id: buyerId })
      .limit(1);
    return order || null;
  }

  async deleteById(orderId) {
    return knex("orders").where("id", orderId).del();
  }
}

module.exports = { OrderRepository };
