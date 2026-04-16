const { AppError } = require("../../../shared/errors/app-error");
const { UserRepository } = require("../repositories/user.repository");
const { UserKycRepository } = require("../repositories/user-kyc.repository");
const { KYC_STATUS } = require("../../../shared/domain/commerce-constants");
const { buildDomainEvent } = require("../../../contracts/events/event-factory");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { eventPublisher } = require("../../../infrastructure/events/event-publisher");

class UserService {
  constructor({
    userRepository = new UserRepository(),
    userKycRepository = new UserKycRepository(),
  } = {}) {
    this.userRepository = userRepository;
    this.userKycRepository = userKycRepository;
  }

  async createUser(payload) {
    const existingUser = await this.userRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new AppError("User already exists", 409);
    }

    return this.userRepository.create(payload);
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  async updateProfile(userId, payload) {
    const updatedUser = await this.userRepository.updateById(userId, {
      $set: {
        profile: payload.profile,
      },
    });

    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return updatedUser;
  }

  async submitKyc(userId, payload) {
    const kyc = await this.userKycRepository.upsert({
      ...payload,
      userId,
      verificationStatus: KYC_STATUS.SUBMITTED,
    });

    await eventPublisher.publish(
      buildDomainEvent(
        DOMAIN_EVENTS.USER_KYC_SUBMITTED_V1,
        {
          userId,
          verificationStatus: kyc.verification_status,
          legalName: kyc.legal_name,
        },
        {
          source: "user-module",
          aggregateId: userId,
        },
      ),
    );

    return kyc;
  }

  async reviewKyc(userId, payload, actor) {
    const kyc = await this.userKycRepository.review(userId, {
      ...payload,
      reviewedBy: actor.userId,
    });

    if (!kyc) {
      throw new AppError("User KYC record not found", 404);
    }

    await eventPublisher.publish(
      buildDomainEvent(
        DOMAIN_EVENTS.KYC_STATUS_UPDATED_V1,
        {
          userId,
          verificationStatus: kyc.verification_status,
          rejectionReason: kyc.rejection_reason,
        },
        {
          source: "user-module",
          aggregateId: userId,
        },
      ),
    );

    return kyc;
  }
}

module.exports = { UserService };
