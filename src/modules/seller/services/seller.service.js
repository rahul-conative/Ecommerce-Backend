const { SellerRepository } = require("../repositories/seller.repository");
const { buildDomainEvent } = require("../../../contracts/events/event-factory");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { eventPublisher } = require("../../../infrastructure/events/event-publisher");
const { KYC_STATUS } = require("../../../shared/domain/commerce-constants");
const { AppError } = require("../../../shared/errors/app-error");

class SellerService {
  constructor({ sellerRepository = new SellerRepository() } = {}) {
    this.sellerRepository = sellerRepository;
  }

  async submitKyc(payload, actor) {
    const record = await this.sellerRepository.upsertKyc({
      ...payload,
      sellerId: actor.userId,
      verificationStatus: KYC_STATUS.SUBMITTED,
    });

    await eventPublisher.publish(
      buildDomainEvent(
        DOMAIN_EVENTS.SELLER_KYC_SUBMITTED_V1,
        {
          sellerId: actor.userId,
          verificationStatus: record.verification_status,
          legalName: record.legal_name,
        },
        {
        source: "seller-module",
        aggregateId: actor.userId,
        },
      ),
    );
    return record;
  }

  async reviewKyc(sellerId, payload, actor) {
    const record = await this.sellerRepository.reviewKyc(sellerId, {
      ...payload,
      reviewedBy: actor.userId,
    });

    if (!record) {
      throw new AppError("Seller KYC record not found", 404);
    }

    await eventPublisher.publish(
      buildDomainEvent(
        DOMAIN_EVENTS.KYC_STATUS_UPDATED_V1,
        {
          sellerId,
          verificationStatus: record.verification_status,
          rejectionReason: record.rejection_reason,
        },
        {
          source: "seller-module",
          aggregateId: sellerId,
        },
      ),
    );

    return record;
  }
}

module.exports = { SellerService };
