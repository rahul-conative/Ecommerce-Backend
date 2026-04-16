const { AuthRepository } = require("../repositories/auth.repository");
const { AppError } = require("../../../shared/errors/app-error");
const { hashValue, compareValue } = require("../../../shared/utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../../../shared/utils/tokens");
const { buildDomainEvent } = require("../../../contracts/events/event-factory");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { eventPublisher } = require("../../../infrastructure/events/event-publisher");
const { socialAuthService } = require("../../../infrastructure/auth/social-auth.service");
const { securityEventService } = require("../../../shared/security/security-event.service");
const { SECURITY_EVENTS } = require("../../../shared/constants/security-events");
const { WalletService } = require("../../wallet/services/wallet.service");
const { ReferralService } = require("../../referral/services/referral.service");

class AuthService {
  constructor({
    authRepository = new AuthRepository(),
    walletService = new WalletService(),
    referralService = new ReferralService(),
  } = {}) {
    this.authRepository = authRepository;
    this.walletService = walletService;
    this.referralService = referralService;
  }

  async register(payload, requestContext = {}) {
    await this.referralService.resolveReferrer(payload.referralCode);
    const existingUser = await this.authRepository.findUserByEmail(payload.email);
    if (existingUser) {
      await this.recordSecurityEvent(SECURITY_EVENTS.AUTH_LOGIN_FAILED, "failed", {
        email: payload.email,
        provider: "password",
        ...requestContext,
        metadata: { reason: "duplicate_account" },
      });
      throw new AppError("User already exists", 409);
    }

    const passwordHash = await hashValue(payload.password);
    const user = await this.authRepository.createUser({
      email: payload.email,
      phone: payload.phone,
      passwordHash,
      role: payload.role,
      profile: payload.profile,
      referralCode: this.generateReferralCode(payload.profile.firstName),
      emailVerified: false,
      authProviders: [],
      refreshSessions: [],
    });

    await this.walletService.ensureWallet(user.id);
    await this.referralService.rewardReferral(payload.referralCode, user);

    await eventPublisher.publish(
      buildDomainEvent(
        DOMAIN_EVENTS.AUTH_USER_REGISTERED_V1,
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        {
          source: "auth-module",
          aggregateId: user.id,
        },
      ),
    );

    return this.issueTokens(user, requestContext, "password");
  }

  async login(payload, requestContext = {}) {
    const user = await this.authRepository.findUserByEmail(payload.email);
    if (!user) {
      await this.recordSecurityEvent(SECURITY_EVENTS.AUTH_LOGIN_FAILED, "failed", {
        email: payload.email,
        provider: "password",
        ...requestContext,
        metadata: { reason: "user_not_found" },
      });
      throw new AppError("Invalid credentials", 401);
    }

    if (!user.passwordHash) {
      await this.recordSecurityEvent(SECURITY_EVENTS.AUTH_LOGIN_FAILED, "failed", {
        userId: user.id,
        email: user.email,
        provider: "password",
        ...requestContext,
        metadata: { reason: "password_login_not_enabled" },
      });
      throw new AppError("Password login is not enabled for this account", 401);
    }

    const isMatch = await compareValue(payload.password, user.passwordHash);
    if (!isMatch) {
      await this.recordSecurityEvent(SECURITY_EVENTS.AUTH_LOGIN_FAILED, "failed", {
        userId: user.id,
        email: user.email,
        provider: "password",
        ...requestContext,
        metadata: { reason: "invalid_password" },
      });
      throw new AppError("Invalid credentials", 401);
    }

    await this.authRepository.updateLastLogin(user.id, new Date());
    return this.issueTokens(user, requestContext, "password");
  }

  async socialLogin(payload, requestContext = {}) {
    try {
      await this.referralService.resolveReferrer(payload.referralCode);
      const providerProfile = await socialAuthService.verifyIdentityToken(payload);
      let user = await this.authRepository.findUserByProvider(
        providerProfile.provider,
        providerProfile.providerUserId,
      );

      if (!user) {
        user = await this.authRepository.findUserByEmail(providerProfile.email);
      }

      if (!user) {
        user = await this.authRepository.createUser({
          email: providerProfile.email,
          role: payload.role,
          referralCode: this.generateReferralCode(providerProfile.firstName || "user"),
          emailVerified: providerProfile.emailVerified,
          passwordHash: undefined,
          profile: {
            firstName: providerProfile.firstName,
            lastName: providerProfile.lastName,
            avatarUrl: providerProfile.avatarUrl,
          },
          authProviders: [
            {
              provider: providerProfile.provider,
              providerUserId: providerProfile.providerUserId,
            },
          ],
          refreshSessions: [],
        });
        await this.walletService.ensureWallet(user.id);
        await this.referralService.rewardReferral(payload.referralCode, user);
      } else {
        user = await this.authRepository.linkSocialProvider(user.id, providerProfile);
      }

      await this.authRepository.updateLastLogin(user.id, new Date());
      return this.issueTokens(user, requestContext, providerProfile.provider, SECURITY_EVENTS.AUTH_SOCIAL_LOGIN_SUCCESS);
    } catch (error) {
      await this.recordSecurityEvent(SECURITY_EVENTS.AUTH_SOCIAL_LOGIN_FAILED, "failed", {
        email: null,
        provider: payload.provider,
        ...requestContext,
        metadata: { reason: error.message },
      });
      throw error;
    }
  }

  async refreshToken(refreshToken, requestContext = {}) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    let payload;

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      await this.recordSecurityEvent(SECURITY_EVENTS.AUTH_REFRESH_FAILED, "failed", {
        provider: "session",
        ...requestContext,
        metadata: { reason: "invalid_signature_or_expired" },
      });
      throw new AppError("Invalid refresh token", 401);
    }

    const user = await this.authRepository.findUserByEmail(payload.email);
    if (!user) {
      await this.recordSecurityEvent(SECURITY_EVENTS.AUTH_REFRESH_FAILED, "failed", {
        email: payload.email,
        provider: "session",
        ...requestContext,
        metadata: { reason: "user_not_found" },
      });
      throw new AppError("Invalid refresh token", 401);
    }

    const currentSession = await this.findMatchingRefreshSession(user.refreshSessions || [], refreshToken);
    if (!currentSession || currentSession.sessionId !== payload.sessionId) {
      await this.recordSecurityEvent(SECURITY_EVENTS.AUTH_REFRESH_FAILED, "failed", {
        userId: user.id,
        email: user.email,
        provider: "session",
        ...requestContext,
        metadata: { reason: "session_not_found" },
      });
      throw new AppError("Invalid refresh token", 401);
    }

    return this.issueTokens(
      user,
      requestContext,
      currentSession.provider || "session",
      SECURITY_EVENTS.AUTH_REFRESH_SUCCESS,
      currentSession.sessionId,
    );
  }

  async issueTokens(
    user,
    requestContext = {},
    provider = "password",
    successEventType = SECURITY_EVENTS.AUTH_LOGIN_SUCCESS,
    replacedSessionId = null,
  ) {
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const refreshPayload = verifyRefreshToken(refreshToken);
    const tokenHash = await hashValue(refreshToken);
    const refreshSessions = (user.refreshSessions || [])
      .filter((session) => session.sessionId !== replacedSessionId)
      .slice(-4);

    refreshSessions.push({
      sessionId: refreshPayload.sessionId,
      tokenHash,
      provider,
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      platform: requestContext.platform,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    });

    await this.authRepository.updateRefreshSessions(user.id, refreshSessions);
    await this.recordSecurityEvent(successEventType, "success", {
      userId: user.id,
      email: user.email,
      provider,
      ...requestContext,
      metadata: { role: user.role },
    });

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async findMatchingRefreshSession(refreshSessions, refreshToken) {
    for (const session of refreshSessions) {
      const matches = await compareValue(refreshToken, session.tokenHash);
      if (matches) {
        return session;
      }
    }

    return null;
  }

  async recordSecurityEvent(eventType, outcome, payload) {
    try {
      await securityEventService.record({
        eventType,
        outcome,
        userId: payload.userId || null,
        email: payload.email || null,
        provider: payload.provider || null,
        ipAddress: payload.ipAddress || null,
        userAgent: payload.userAgent || null,
        requestId: payload.requestId || null,
        platform: payload.platform || null,
        metadata: payload.metadata || {},
      });
    } catch (error) {
      return null;
    }
  }

  generateReferralCode(seed) {
    const normalizedSeed = (seed || "user").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4) || "USER";
    const randomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${normalizedSeed}${randomCode}`;
  }
}

module.exports = { AuthService };
