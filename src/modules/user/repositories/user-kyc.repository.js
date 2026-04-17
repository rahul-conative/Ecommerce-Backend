const { knex } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");

class UserKycRepository {
  async upsert(payload) {
    const id = uuidv4();
    const [record] = await knex("user_kyc")
      .insert({
        id,
        user_id: payload.userId,
        pan_number: payload.panNumber || null,
        aadhaar_number: payload.aadhaarNumber || null,
        legal_name: payload.legalName,
        verification_status: payload.verificationStatus,
        documents: JSON.stringify(payload.documents || {}),
        rejection_reason: payload.rejectionReason || null,
        submitted_at: knex.fn.now(),
      })
      .onConflict("user_id")
      .merge({
        pan_number: payload.panNumber || null,
        aadhaar_number: payload.aadhaarNumber || null,
        legal_name: payload.legalName,
        verification_status: payload.verificationStatus,
        documents: JSON.stringify(payload.documents || {}),
        rejection_reason: payload.rejectionReason || null,
        submitted_at: knex.fn.now(),
      })
      .returning("*");

    return record;
  }

  async review(userId, payload) {
    const [record] = await knex("user_kyc")
      .where("user_id", userId)
      .update({
        verification_status: payload.verificationStatus,
        reviewed_by: payload.reviewedBy,
        rejection_reason: payload.rejectionReason || null,
        reviewed_at: knex.fn.now(),
      })
      .returning("*");
    return record || null;
  }
}

module.exports = { UserKycRepository };
