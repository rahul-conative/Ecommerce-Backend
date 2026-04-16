const { env } = require("../../../config/env");
const { AppError } = require("../../../shared/errors/app-error");
const { buildDomainEvent } = require("../../../contracts/events/event-factory");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { eventPublisher } = require("../../../infrastructure/events/event-publisher");
const { ReferralRepository } = require("../repositories/referral.repository");
const { WalletService } = require("../../wallet/services/wallet.service");

class ReferralService {
  constructor({
    referralRepository = new ReferralRepository(),
    walletService = new WalletService(),
  } = {}) {
    this.referralRepository = referralRepository;
    this.walletService = walletService;
  }

  async resolveReferrer(referralCode) {
    if (!referralCode) {
      return null;
    }

    const referrer = await this.referralRepository.findReferrerByCode(referralCode);
    if (!referrer) {
      throw new AppError("Invalid referral code", 400);
    }

    return referrer;
  }

  async rewardReferral(referralCode, refereeUser) {
    if (!referralCode) {
      return null;
    }

    const existingReferral = await this.referralRepository.findByRefereeUserId(refereeUser.id);
    if (existingReferral) {
      return existingReferral;
    }

    const referrer = await this.resolveReferrer(referralCode);

    if (String(referrer.id) === String(refereeUser.id)) {
      throw new AppError("You cannot refer yourself", 400);
    }

    await this.walletService.credit(referrer.id, env.commerce.referralReferrerBonus, {
      referenceType: "referral",
      referenceId: refereeUser.id,
      metadata: { role: "referrer" },
    });
    await this.walletService.credit(refereeUser.id, env.commerce.referralRefereeBonus, {
      referenceType: "referral",
      referenceId: referrer.id,
      metadata: { role: "referee" },
    });

    const referral = await this.referralRepository.createReward({
      referrerUserId: referrer.id,
      refereeUserId: refereeUser.id,
      referralCode,
      referrerRewardAmount: env.commerce.referralReferrerBonus,
      refereeRewardAmount: env.commerce.referralRefereeBonus,
    });

    await eventPublisher.publish(
      buildDomainEvent(
        DOMAIN_EVENTS.REFERRAL_REWARDED_V1,
        {
          referrerUserId: referrer.id,
          refereeUserId: refereeUser.id,
          referralCode,
        },
        { source: "referral-module", aggregateId: refereeUser.id },
      ),
    );

    return referral;
  }
}

module.exports = { ReferralService };
