const { ReferralModel } = require("../models/referral.model");
const { UserRepository } = require("../../user/repositories/user.repository");

class ReferralRepository {
  constructor({ userRepository = new UserRepository() } = {}) {
    this.userRepository = userRepository;
  }

  async findReferrerByCode(referralCode) {
    return this.userRepository.findByReferralCode(referralCode);
  }

  async createReward(payload) {
    return ReferralModel.create(payload);
  }

  async findByRefereeUserId(refereeUserId) {
    return ReferralModel.findOne({ refereeUserId });
  }
}

module.exports = { ReferralRepository };
