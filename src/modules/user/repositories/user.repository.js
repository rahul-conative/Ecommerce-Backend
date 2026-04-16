const { UserModel } = require("../models/user.model");

class UserRepository {
  async create(payload) {
    return UserModel.create(payload);
  }

  async findByEmail(email) {
    return UserModel.findOne({ email });
  }

  async findById(userId) {
    return UserModel.findById(userId);
  }

  async findByProvider(provider, providerUserId) {
    return UserModel.findOne({
      authProviders: {
        $elemMatch: {
          provider,
          providerUserId,
        },
      },
    });
  }

  async findByReferralCode(referralCode) {
    return UserModel.findOne({ referralCode });
  }

  async updateById(userId, payload) {
    return UserModel.findByIdAndUpdate(userId, payload, { new: true });
  }
}

module.exports = { UserRepository };
