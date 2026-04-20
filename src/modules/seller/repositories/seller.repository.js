const { postgresPool } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");
const { UserRepository } = require("../../user/repositories/user.repository");

class SellerRepository {
  constructor({ userRepository = new UserRepository() } = {}) {
    this.userRepository = userRepository;
  }

  async upsertKyc(payload) {
    const id = uuidv4();
    const { rows } = await postgresPool.query(
      `INSERT INTO seller_kyc (
        id, seller_id, pan_number, gst_number, aadhaar_number, legal_name, business_type,
        verification_status, documents, rejection_reason, submitted_at
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (seller_id) DO UPDATE SET
         pan_number = EXCLUDED.pan_number,
         gst_number = EXCLUDED.gst_number,
         aadhaar_number = EXCLUDED.aadhaar_number,
         legal_name = EXCLUDED.legal_name,
         business_type = EXCLUDED.business_type,
         verification_status = EXCLUDED.verification_status,
         documents = EXCLUDED.documents,
         rejection_reason = EXCLUDED.rejection_reason,
         submitted_at = NOW()
       RETURNING *`,
      [
        id,
        payload.sellerId,
        payload.panNumber,
        payload.gstNumber || null,
        payload.aadhaarNumber || null,
        payload.legalName,
        payload.businessType || null,
        payload.verificationStatus,
        JSON.stringify(payload.documents || {}),
        payload.rejectionReason || null,
      ],
    );

    return rows[0];
  }

  async reviewKyc(sellerId, payload) {
    const { rows } = await postgresPool.query(
      `UPDATE seller_kyc
       SET verification_status = $2,
           reviewed_by = $3,
           rejection_reason = $4,
           reviewed_at = NOW()
       WHERE seller_id = $1
       RETURNING *`,
      [sellerId, payload.verificationStatus, payload.reviewedBy, payload.rejectionReason || null],
    );

    return rows[0] || null;
  }

  async findKycBySellerId(sellerId) {
    const { rows } = await postgresPool.query("SELECT * FROM seller_kyc WHERE seller_id = $1 LIMIT 1", [sellerId]);
    return rows[0] || null;
  }

  async updateSellerProfile(sellerId, payload) {
    return this.userRepository.updateById(sellerId, {
      $set: {
        sellerProfile: payload,
      },
    });
  }

  async updateSellerSettings(sellerId, payload) {
    return this.userRepository.updateById(sellerId, {
      $set: {
        sellerSettings: payload,
      },
    });
  }

  async findSellerById(sellerId) {
    return this.userRepository.findById(sellerId);
  }

  async fetchDashboardSummary(sellerId, fromDate, toDate) {
    const { rows } = await postgresPool.query(
      `SELECT
         COUNT(DISTINCT o.id)::INT AS total_orders,
         COALESCE(SUM(oi.quantity), 0)::INT AS units_sold,
         COALESCE(SUM(oi.line_total), 0)::NUMERIC AS gmv,
         COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN oi.line_total ELSE 0 END), 0)::NUMERIC AS delivered_revenue,
         COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END)::INT AS cancelled_orders,
         COUNT(DISTINCT CASE WHEN o.status = 'returned' THEN o.id END)::INT AS returned_orders,
         COALESCE(AVG(oi.line_total), 0)::NUMERIC AS avg_item_value
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE oi.seller_id = $1
         AND o.created_at BETWEEN $2 AND $3`,
      [sellerId, fromDate, toDate],
    );
    return rows[0];
  }

  async fetchTopProducts(sellerId, fromDate, toDate, limit = 5) {
    const { rows } = await postgresPool.query(
      `SELECT
         oi.product_id,
         COALESCE(SUM(oi.quantity), 0)::INT AS units_sold,
         COALESCE(SUM(oi.line_total), 0)::NUMERIC AS revenue
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE oi.seller_id = $1
         AND o.created_at BETWEEN $2 AND $3
       GROUP BY oi.product_id
       ORDER BY revenue DESC
       LIMIT $4`,
      [sellerId, fromDate, toDate, limit],
    );
    return rows;
  }

  async fetchRecentOrders(sellerId, limit = 10) {
    const { rows } = await postgresPool.query(
      `SELECT
         o.id,
         o.buyer_id,
         o.status,
         o.currency,
         o.payable_amount,
         o.created_at,
         COALESCE(SUM(oi.line_total), 0)::NUMERIC AS seller_order_total
       FROM orders o
       INNER JOIN order_items oi ON oi.order_id = o.id
       WHERE oi.seller_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $2`,
      [sellerId, limit],
    );

    return rows;
  }
}

module.exports = { SellerRepository };
