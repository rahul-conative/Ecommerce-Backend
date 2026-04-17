const { knex } = require("../../../infrastructure/postgres/postgres-client");
const { v4: uuidv4 } = require("uuid");

class SellerRepository {
  async upsertKyc(payload) {
    const id = uuidv4();
    const [record] = await knex("seller_kyc")
      .insert({
        id,
        seller_id: payload.sellerId,
        pan_number: payload.panNumber,
        gst_number: payload.gstNumber || null,
        aadhaar_number: payload.aadhaarNumber || null,
        legal_name: payload.legalName,
        business_type: payload.businessType || null,
        verification_status: payload.verificationStatus,
        documents: JSON.stringify(payload.documents || {}),
        rejection_reason: payload.rejectionReason || null,
        submitted_at: knex.fn.now(),
      })
      .onConflict("seller_id")
      .merge({
        pan_number: payload.panNumber,
        gst_number: payload.gstNumber || null,
        aadhaar_number: payload.aadhaarNumber || null,
        legal_name: payload.legalName,
        business_type: payload.businessType || null,
        verification_status: payload.verificationStatus,
        documents: JSON.stringify(payload.documents || {}),
        rejection_reason: payload.rejectionReason || null,
        submitted_at: knex.fn.now(),
      })
      .returning("*");

    return record;
  }

  async reviewKyc(sellerId, payload) {
    const [record] = await knex("seller_kyc")
      .where("seller_id", sellerId)
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

module.exports = { SellerRepository };
