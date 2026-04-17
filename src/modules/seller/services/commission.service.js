const { knex } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");
const { logger } = require("../../../shared/logger/logger");
const { AppError } = require("../../../shared/errors/app-error");

/**
 * Seller Commission Management (FINTECH SAFE)
 */

class SellerCommissionService {
  // ==============================
  // Helper: Safe Money Round
  // ==============================
  round(value) {
    return Math.round(value * 100) / 100;
  }

  // ==============================
  // Calculate Commission
  // ==============================
  async calculateCommission(orderId, sellerId, orderAmount, sellerTier = "bronze") {
    if (!orderId || !sellerId || orderAmount <= 0) {
      throw new AppError("Invalid commission input", 400);
    }

    const commissionRates = {
      bronze: 0.15,
      silver: 0.12,
      gold: 0.1,
      platinum: 0.08,
    };

    const rate = commissionRates[sellerTier] ?? commissionRates.bronze;

    const commissionAmount = this.round(orderAmount * rate);
    const taxAmount = this.round(commissionAmount * 0.18);
    const netAmount = this.round(commissionAmount - taxAmount);

    await knex("seller_commissions").insert({
      id: uuidv4(),
      seller_id: sellerId,
      order_id: orderId,
      amount: orderAmount,
      commission_rate: rate,
      commission_amount: commissionAmount,
      tax_amount: taxAmount,
      net_amount: netAmount,
      status: "pending",
      created_at: knex.fn.now(),
    });

    logger.info(
      { orderId, sellerId, commissionAmount, taxAmount },
      "Commission calculated"
    );

    return { commissionAmount, taxAmount, netAmount };
  }

  // ==============================
  // Seller Earnings
  // ==============================
  async getSellerEarnings(sellerId, startDate, endDate) {
    const result = await knex("seller_commissions")
      .where("seller_id", sellerId)
      .whereBetween("created_at", [startDate, endDate])
      .whereIn("status", ["paid", "pending"])
      .sum({ total_earned: "net_amount" })
      .sum({ total_commission: "commission_amount" })
      .count({ order_count: "*" })
      .first();

    return result || {
      total_earned: 0,
      total_commission: 0,
      order_count: 0,
    };
  }

  // ==============================
  // Initiate Payout (TRANSACTION SAFE)
  // ==============================
  async initiatePayout(sellerId, periodStart, periodEnd) {
    return await knex.transaction(async (trx) => {
      // Lock rows to prevent race condition
      const commissions = await trx("seller_commissions")
        .where("seller_id", sellerId)
        .where("status", "pending")
        .forUpdate();

      if (!commissions.length) {
        throw new AppError("No commissions to payout", 400);
      }

      const totals = commissions.reduce(
        (acc, c) => {
          acc.totalAmount += Number(c.amount || 0);
          acc.commissionAmount += Number(c.commission_amount || 0);
          acc.taxAmount += Number(c.tax_amount || 0);
          acc.netAmount += Number(c.net_amount || 0);
          return acc;
        },
        { totalAmount: 0, commissionAmount: 0, taxAmount: 0, netAmount: 0 }
      );

      if (totals.netAmount <= 0) {
        throw new AppError("Invalid payout amount", 400);
      }

      const payoutId = uuidv4();

      await trx("seller_payouts").insert({
        id: payoutId,
        seller_id: sellerId,
        period_start: periodStart,
        period_end: periodEnd,
        total_amount: this.round(totals.totalAmount),
        commission_amount: this.round(totals.commissionAmount),
        tax_amount: this.round(totals.taxAmount),
        net_amount: this.round(totals.netAmount),
        status: "processing",
        created_at: knex.fn.now(),
      });

      // Mark commissions as paid (linked to payout)
      await trx("seller_commissions")
        .whereIn(
          "id",
          commissions.map((c) => c.id)
        )
        .update({
          status: "paid",
          payout_id: payoutId,
        });

      logger.info(
        { sellerId, payoutId, amount: totals.netAmount },
        "Payout initiated"
      );

      return payoutId;
    });
  }

  // ==============================
  // Process Payout (IDEMPOTENT)
  // ==============================
  async processPayout(payoutId, paymentReference) {
    return await knex.transaction(async (trx) => {
      const payout = await trx("seller_payouts")
        .where("id", payoutId)
        .first()
        .forUpdate();

      if (!payout) {
        throw new AppError("Payout not found", 404);
      }

      if (payout.status === "completed") {
        return payout; // idempotent
      }

      await trx("seller_payouts")
        .where("id", payoutId)
        .update({
          status: "completed",
          payment_reference: paymentReference,
        });

      logger.info(
        { payoutId, reference: paymentReference },
        "Payout completed"
      );

      return { ...payout, status: "completed", payment_reference: paymentReference };
    });
  }
}

module.exports = {
  SellerCommissionService: new SellerCommissionService(),
};