const { postgresPool } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");
const { OutboxRepository } = require("../../../infrastructure/postgres/outbox.repository");

class PaymentRepository {
  constructor({ outboxRepository = new OutboxRepository() } = {}) {
    this.outboxRepository = outboxRepository;
  }

  async createPayment(payload, event) {
    const client = await postgresPool.connect();
    const payment = {
      id: uuidv4(),
      ...payload,
      transactionReference: payload.transactionReference || uuidv4(),
    };

    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO payments (
          id, order_id, buyer_id, provider, status, amount, currency, transaction_reference,
          provider_order_id, provider_payment_id, verification_method, metadata, verified_at, failed_reason
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          payment.id,
          payment.orderId,
          payment.buyerId,
          payment.provider,
          payment.status,
          payment.amount,
          payment.currency,
          payment.transactionReference,
          payment.providerOrderId || null,
          payment.providerPaymentId || null,
          payment.verificationMethod || null,
          JSON.stringify(payment.metadata || {}),
          payment.verifiedAt || null,
          payment.failedReason || null,
        ],
      );

      if (event) {
        await this.outboxRepository.enqueue(client, {
          ...event,
          aggregateId: payment.id,
        });
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return payment;
  }

  async listPaymentsByBuyer(buyerId) {
    const { rows } = await postgresPool.query(
      "SELECT * FROM payments WHERE buyer_id = $1 ORDER BY created_at DESC",
      [buyerId],
    );
    return rows;
  }

  async findByOrderId(orderId, buyerId) {
    const { rows } = await postgresPool.query(
      "SELECT * FROM payments WHERE order_id = $1 AND buyer_id = $2 ORDER BY created_at DESC LIMIT 1",
      [orderId, buyerId],
    );
    return rows[0] || null;
  }

  async findByProviderOrderId(providerOrderId) {
    const { rows } = await postgresPool.query(
      "SELECT * FROM payments WHERE provider_order_id = $1 ORDER BY created_at DESC LIMIT 1",
      [providerOrderId],
    );
    return rows[0] || null;
  }

  async updatePaymentStatus(paymentId, payload, event = null) {
    const client = await postgresPool.connect();

    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `UPDATE payments
         SET status = $2,
             provider_payment_id = COALESCE($3, provider_payment_id),
             verification_method = COALESCE($4, verification_method),
             metadata = COALESCE(metadata, '{}'::jsonb) || $5::jsonb,
             verified_at = COALESCE($6, verified_at),
             failed_reason = COALESCE($7, failed_reason)
         WHERE id = $1
         RETURNING *`,
        [
          paymentId,
          payload.status,
          payload.providerPaymentId || null,
          payload.verificationMethod || null,
          JSON.stringify(payload.metadata || {}),
          payload.verifiedAt || null,
          payload.failedReason || null,
        ],
      );

      if (event) {
        await this.outboxRepository.enqueue(client, {
          ...event,
          aggregateId: paymentId,
        });
      }

      await client.query("COMMIT");
      return rows[0] || null;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listPaymentsForAdmin({
    status = null,
    provider = null,
    buyerId = null,
    fromDate = null,
    toDate = null,
    limit = 50,
    offset = 0,
  } = {}) {
    const values = [];
    const clauses = [];
    let index = 1;

    if (status) {
      clauses.push(`status = $${index++}`);
      values.push(status);
    }
    if (provider) {
      clauses.push(`provider = $${index++}`);
      values.push(provider);
    }
    if (buyerId) {
      clauses.push(`buyer_id = $${index++}`);
      values.push(buyerId);
    }
    if (fromDate) {
      clauses.push(`created_at >= $${index++}`);
      values.push(fromDate);
    }
    if (toDate) {
      clauses.push(`created_at <= $${index++}`);
      values.push(toDate);
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    values.push(limit, offset);

    const { rows } = await postgresPool.query(
      `SELECT *
       FROM payments
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${index++}
       OFFSET $${index}`,
      values,
    );
    return rows;
  }
}

module.exports = { PaymentRepository };
