const { postgresPool } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");

class SellerRepository {
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
}

module.exports = { SellerRepository };
