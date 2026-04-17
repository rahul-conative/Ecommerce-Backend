const { knex } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");
const { OutboxRepository } = require("../../../infrastructure/postgres/outbox.repository");

class PaymentRepository {
  constructor({ outboxRepository = new OutboxRepository() } = {}) {
    this.outboxRepository = outboxRepository;
  }

  async createPayment(payload, event) {
    const payment = {
      id: uuidv4(),
      order_id: payload.orderId,
      buyer_id: payload.buyerId,
      provider: payload.provider,
      status: payload.status,
      amount: payload.amount,
      currency: payload.currency,
      transaction_reference: payload.transactionReference || uuidv4(),
      provider_order_id: payload.providerOrderId || null,
      provider_payment_id: payload.providerPaymentId || null,
      verification_method: payload.verificationMethod || null,
      metadata: JSON.stringify(payload.metadata || {}),
      verified_at: payload.verifiedAt || null,
      failed_reason: payload.failedReason || null,
    };

    const trx = await knex.transaction();

    try {
      await trx("payments").insert(payment);

      if (event) {
        await this.outboxRepository.enqueue(trx, {
          ...event,
          aggregateId: payment.id,
        });
      }

      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }

    return {
      id: payment.id,
      orderId: payload.orderId,
      buyerId: payload.buyerId,
      provider: payload.provider,
      status: payload.status,
      amount: payload.amount,
      currency: payload.currency,
      transactionReference: payment.transaction_reference,
      providerOrderId: payload.providerOrderId || null,
      providerPaymentId: payload.providerPaymentId || null,
      verificationMethod: payload.verificationMethod || null,
      metadata: payload.metadata || {},
      verifiedAt: payload.verifiedAt || null,
      failedReason: payload.failedReason || null,
    };
  }

  async listPaymentsByBuyer(buyerId) {
    return knex("payments").where("buyer_id", buyerId).orderBy("created_at", "desc");
  }

  async findByOrderId(orderId, buyerId) {
    const [payment] = await knex("payments")
      .where({ order_id: orderId, buyer_id: buyerId })
      .orderBy("created_at", "desc")
      .limit(1);
    return payment || null;
  }

  async findByProviderOrderId(providerOrderId) {
    const [payment] = await knex("payments")
      .where("provider_order_id", providerOrderId)
      .orderBy("created_at", "desc")
      .limit(1);
    return payment || null;
  }

  async updatePaymentStatus(paymentId, payload, event = null) {
    const trx = await knex.transaction();

    try {
      const [payment] = await trx("payments")
        .where("id", paymentId)
        .update({
          status: payload.status,
          provider_payment_id: payload.providerPaymentId || knex.raw("COALESCE(provider_payment_id, ?)", [null]),
          verification_method: payload.verificationMethod || knex.raw("COALESCE(verification_method, ?)", [null]),
          metadata: knex.raw("COALESCE(metadata, '{}'::jsonb) || ?::jsonb", [JSON.stringify(payload.metadata || {})]),
          verified_at: payload.verifiedAt || knex.raw("COALESCE(verified_at, ?)", [null]),
          failed_reason: payload.failedReason || knex.raw("COALESCE(failed_reason, ?)", [null]),
        })
        .returning("*");

      if (event) {
        await this.outboxRepository.enqueue(trx, {
          ...event,
          aggregateId: paymentId,
        });
      }

      await trx.commit();
      return payment || null;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}

module.exports = { PaymentRepository };
