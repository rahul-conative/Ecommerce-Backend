const { postgresPool } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");
const { OutboxRepository } = require("../../../infrastructure/postgres/outbox.repository");

class OrderRepository {
  constructor({ outboxRepository = new OutboxRepository() } = {}) {
    this.outboxRepository = outboxRepository;
  }

  async createOrder(payload, event) {
    const client = await postgresPool.connect();
    const orderId = payload.id || uuidv4();

    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO orders (
          id, buyer_id, status, currency, subtotal_amount, discount_amount, tax_amount, total_amount,
          shipping_address, coupon_code, wallet_discount_amount, payable_amount, tax_breakup
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          orderId,
          payload.buyerId,
          payload.status,
          payload.currency,
          payload.subtotalAmount,
          payload.discountAmount,
          payload.taxAmount,
          payload.totalAmount,
          JSON.stringify(payload.shippingAddress),
          payload.couponCode || null,
          payload.walletDiscountAmount || 0,
          payload.payableAmount || payload.totalAmount,
          JSON.stringify(payload.taxBreakup || {}),
        ],
      );

      for (const item of payload.items) {
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, seller_id, quantity, unit_price, line_total)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [uuidv4(), orderId, item.productId, item.sellerId, item.quantity, item.unitPrice, item.lineTotal],
        );
      }

      if (event) {
        await this.outboxRepository.enqueue(client, {
          ...event,
          aggregateId: orderId,
        });
      }

      await client.query("COMMIT");
      return { id: orderId, ...payload };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listOrdersByBuyer(buyerId) {
    const { rows } = await postgresPool.query(
      "SELECT * FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC",
      [buyerId],
    );
    return rows;
  }

  async updateStatus(orderId, status) {
    const { rows } = await postgresPool.query(
      "UPDATE orders SET status = $2 WHERE id = $1 RETURNING *",
      [orderId, status],
    );
    return rows[0] || null;
  }

  async findById(orderId) {
    const { rows } = await postgresPool.query("SELECT * FROM orders WHERE id = $1 LIMIT 1", [orderId]);
    return rows[0] || null;
  }

  async findByIdAndBuyer(orderId, buyerId) {
    const { rows } = await postgresPool.query(
      "SELECT * FROM orders WHERE id = $1 AND buyer_id = $2 LIMIT 1",
      [orderId, buyerId],
    );
    return rows[0] || null;
  }

  async deleteById(orderId) {
    return postgresPool.query("DELETE FROM orders WHERE id = $1", [orderId]);
  }
}

module.exports = { OrderRepository };
