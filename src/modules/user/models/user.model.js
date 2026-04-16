const { mongoose } = require("../../../infrastructure/mongo/mongo-client");
const { ROLES } = require("../../../shared/constants/roles");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, index: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.BUYER,
      index: true,
    },
    profile: {
      firstName: String,
      lastName: String,
      avatarUrl: String,
    },
    referralCode: { type: String, unique: true, sparse: true, index: true },
    referredByUserId: { type: String, index: true },
    emailVerified: { type: Boolean, default: false },
    accountStatus: { type: String, default: "active", index: true },
    authProviders: [
      {
        provider: { type: String, required: true },
        providerUserId: { type: String, required: true },
        linkedAt: { type: Date, default: Date.now },
      },
    ],
    refreshSessions: [
      {
        sessionId: { type: String, required: true },
        tokenHash: { type: String, required: true },
        provider: { type: String, default: "password" },
        ipAddress: String,
        userAgent: String,
        platform: String,
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: { type: Date, default: Date.now },
      },
    ],
    lastLoginAt: Date,
  },
  { timestamps: true },
);

userSchema.index({ "authProviders.provider": 1, "authProviders.providerUserId": 1 });

const UserModel = mongoose.model("User", userSchema);

module.exports = { UserModel };
