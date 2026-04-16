const { OAuth2Client } = require("google-auth-library");
const { AppError } = require("../../shared/errors/app-error");
const { env } = require("../../config/env");
const { admin, getFirebaseApp } = require("./firebase-admin");

const googleClient = new OAuth2Client();

class SocialAuthService {
  async verifyIdentityToken({ provider, idToken }) {
    if (provider === "google") {
      return this.verifyGoogleToken(idToken);
    }

    if (provider === "firebase") {
      return this.verifyFirebaseToken(idToken);
    }

    throw new AppError("Unsupported social login provider", 400);
  }

  async verifyGoogleToken(idToken) {
    if (!env.googleClientIds.length) {
      throw new AppError("Google login is not configured", 503);
    }

    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.googleClientIds,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new AppError("Invalid Google identity token", 401);
    }

    if (!payload?.email || !payload.email_verified) {
      throw new AppError("Google account email is not verified", 401);
    }

    return {
      provider: "google",
      providerUserId: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: true,
      firstName: payload.given_name || "",
      lastName: payload.family_name || "",
      avatarUrl: payload.picture || "",
    };
  }

  async verifyFirebaseToken(idToken) {
    const app = getFirebaseApp();
    if (!app) {
      throw new AppError("Firebase login is not configured", 503);
    }

    let decodedToken;

    try {
      decodedToken = await admin.auth(app).verifyIdToken(idToken, true);
    } catch (error) {
      throw new AppError("Invalid Firebase identity token", 401);
    }

    if (!decodedToken.email || !decodedToken.email_verified) {
      throw new AppError("Firebase account email is not verified", 401);
    }

    return {
      provider: "firebase",
      providerUserId: decodedToken.uid,
      email: decodedToken.email.toLowerCase(),
      emailVerified: true,
      firstName: decodedToken.name?.split(" ")?.[0] || "",
      lastName: decodedToken.name?.split(" ")?.slice(1).join(" ") || "",
      avatarUrl: decodedToken.picture || "",
    };
  }
}

const socialAuthService = new SocialAuthService();

module.exports = { SocialAuthService, socialAuthService };
