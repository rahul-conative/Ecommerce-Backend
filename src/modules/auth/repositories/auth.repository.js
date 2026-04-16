const { UserRepository } = require("../../user/repositories/user.repository");

class AuthRepository {
  constructor({ userRepository = new UserRepository() } = {}) {
    this.userRepository = userRepository;
  }

  async findUserByEmail(email) {
    return this.userRepository.findByEmail(email);
  }

  async createUser(payload) {
    return this.userRepository.create(payload);
  }

  async findUserByProvider(provider, providerUserId) {
    return this.userRepository.findByProvider(provider, providerUserId);
  }

  async updateRefreshSessions(userId, refreshSessions) {
    return this.userRepository.updateById(userId, { $set: { refreshSessions } });
  }

  async updateLastLogin(userId, lastLoginAt) {
    return this.userRepository.updateById(userId, { $set: { lastLoginAt } });
  }

  async linkSocialProvider(userId, providerPayload) {
    return this.userRepository.updateById(userId, {
      $set: {
        emailVerified: providerPayload.emailVerified,
        "profile.avatarUrl": providerPayload.avatarUrl || undefined,
      },
      $addToSet: {
        authProviders: {
          provider: providerPayload.provider,
          providerUserId: providerPayload.providerUserId,
        },
      },
    });
  }
}

module.exports = { AuthRepository };
