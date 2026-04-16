const { postgresPool } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");

class UserKycRepository {
  async upsert(payload) {
    const id = uuidv4();
    const { rows } = await postgresPool.query(
      `INSERT INTO user_kyc (
        id, user_id, pan_number, aadhaar_number, legal_name, verification_status, documents,
        rejection_reason, submitted_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        pan_number = EXCLUDED.pan_number,
        aadhaar_number = EXCLUDED.aadhaar_number,
        legal_name = EXCLUDED.legal_name,
        verification_status = EXCLUDED.verification_status,
        documents = EXCLUDED.documents,
        rejection_reason = EXCLUDED.rejection_reason,
        submitted_at = NOW()
      RETURNING *`,
      [
        id,
        payload.userId,
        payload.panNumber || null,
        payload.aadhaarNumber || null,
        payload.legalName,
        payload.verificationStatus,
        JSON.stringify(payload.documents || {}),
        payload.rejectionReason || null,
      ],
    );

    return rows[0];
  }

  async review(userId, payload) {
    const { rows } = await postgresPool.query(
      `UPDATE user_kyc
       SET verification_status = $2,
           reviewed_by = $3,
           rejection_reason = $4,
           reviewed_at = NOW()
       WHERE user_id = $1
       RETURNING *`,
      [userId, payload.verificationStatus, payload.reviewedBy, payload.rejectionReason || null],
    );
    return rows[0] || null;
  }
}

module.exports = { UserKycRepository };
