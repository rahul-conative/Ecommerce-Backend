const { postgresPool } = require("../../../infrastructure/postgres/postgres-client");
const { UserModel } = require("../../user/models/user.model");
const { ProductModel } = require("../../product/models/product.model");
const { v4: uuidv4 } = require("uuid");

class AdminRepository {
  async getOverviewStats() {
    const [totalUsers, totalSellers, totalProducts, pendingProducts] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ role: "seller" }),
      ProductModel.countDocuments({}),
      ProductModel.countDocuments({ status: "pending_approval" }),
    ]);

    const [ordersAgg, paymentsAgg] = await Promise.all([
      postgresPool.query(
        `SELECT
           COUNT(*)::INT AS total_orders,
           COALESCE(SUM(total_amount), 0)::NUMERIC AS gmv
         FROM orders`,
      ),
      postgresPool.query(
        `SELECT
           COUNT(*)::INT AS total_payments,
           COALESCE(SUM(amount), 0)::NUMERIC AS total_collected
         FROM payments
         WHERE status = 'captured'`,
      ),
    ]);

    return {
      users: {
        totalUsers,
        totalSellers,
      },
      catalog: {
        totalProducts,
        pendingProducts,
      },
      commerce: {
        totalOrders: Number(ordersAgg.rows[0]?.total_orders || 0),
        gmv: Number(ordersAgg.rows[0]?.gmv || 0),
      },
      payments: {
        totalPayments: Number(paymentsAgg.rows[0]?.total_payments || 0),
        totalCollected: Number(paymentsAgg.rows[0]?.total_collected || 0),
      },
    };
  }

  async listVendors({ q = "", status = null, limit = 50, page = 1 } = {}) {
    const filter = { role: "seller" };
    if (status) {
      filter.accountStatus = status;
    }
    if (q) {
      filter.$or = [
        { email: { $regex: q, $options: "i" } },
        { "sellerProfile.displayName": { $regex: q, $options: "i" } },
        { "sellerProfile.legalBusinessName": { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      UserModel.find(filter)
        .select("email phone accountStatus sellerProfile createdAt updatedAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      UserModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async updateVendorStatus(sellerId, payload) {
    return UserModel.findByIdAndUpdate(
      sellerId,
      {
        $set: {
          accountStatus: payload.accountStatus,
          "sellerProfile.onboardingStatus":
            payload.accountStatus === "active" ? "ready_for_go_live" : "in_progress",
        },
      },
      { new: true },
    );
  }

  async listProductsForModeration({ status = "pending_approval", category = null, limit = 50, page = 1 } = {}) {
    const filter = { status };
    if (category) {
      filter.category = category;
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ProductModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ProductModel.countDocuments(filter),
    ]);
    return { items, total };
  }

  async listOrders({ status = null, fromDate = null, toDate = null, limit = 50, offset = 0 } = {}) {
    const values = [];
    const clauses = [];
    let idx = 1;

    if (status) {
      clauses.push(`status = $${idx++}`);
      values.push(status);
    }
    if (fromDate) {
      clauses.push(`created_at >= $${idx++}`);
      values.push(fromDate);
    }
    if (toDate) {
      clauses.push(`created_at <= $${idx++}`);
      values.push(toDate);
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    values.push(limit, offset);

    const { rows } = await postgresPool.query(
      `SELECT *
       FROM orders
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${idx++}
       OFFSET $${idx}`,
      values,
    );
    return rows;
  }

  async listPayments({ status = null, provider = null, fromDate = null, toDate = null, limit = 50, offset = 0 } = {}) {
    const values = [];
    const clauses = [];
    let idx = 1;

    if (status) {
      clauses.push(`status = $${idx++}`);
      values.push(status);
    }
    if (provider) {
      clauses.push(`provider = $${idx++}`);
      values.push(provider);
    }
    if (fromDate) {
      clauses.push(`created_at >= $${idx++}`);
      values.push(fromDate);
    }
    if (toDate) {
      clauses.push(`created_at <= $${idx++}`);
      values.push(toDate);
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    values.push(limit, offset);

    const { rows } = await postgresPool.query(
      `SELECT *
       FROM payments
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${idx++}
       OFFSET $${idx}`,
      values,
    );
    return rows;
  }

  async createPayout(payload) {
    const { rows } = await postgresPool.query(
      `INSERT INTO vendor_payouts (
        id, seller_id, period_start, period_end, gross_amount, commission_amount,
        processing_fee_amount, tax_withheld_amount, net_payout_amount, currency, status,
        scheduled_at, metadata
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
      )
      RETURNING *`,
      [
        uuidv4(),
        payload.sellerId,
        payload.periodStart,
        payload.periodEnd,
        payload.grossAmount,
        payload.commissionAmount || 0,
        payload.processingFeeAmount || 0,
        payload.taxWithheldAmount || 0,
        payload.netPayoutAmount,
        payload.currency || "INR",
        payload.status || "scheduled",
        payload.scheduledAt || new Date(),
        payload.metadata || {},
      ],
    );
    return rows[0];
  }

  async listPayouts({ sellerId = null, status = null, fromDate = null, toDate = null, limit = 50, offset = 0 } = {}) {
    const values = [];
    const clauses = [];
    let idx = 1;

    if (sellerId) {
      clauses.push(`seller_id = $${idx++}`);
      values.push(sellerId);
    }
    if (status) {
      clauses.push(`status = $${idx++}`);
      values.push(status);
    }
    if (fromDate) {
      clauses.push(`created_at >= $${idx++}`);
      values.push(fromDate);
    }
    if (toDate) {
      clauses.push(`created_at <= $${idx++}`);
      values.push(toDate);
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    values.push(limit, offset);

    const { rows } = await postgresPool.query(
      `SELECT *
       FROM vendor_payouts
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${idx++}
       OFFSET $${idx}`,
      values,
    );
    return rows;
  }
}

module.exports = { AdminRepository };

