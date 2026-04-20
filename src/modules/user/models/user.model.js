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
    sellerProfile: {
      displayName: String,
      legalBusinessName: String,
      description: String,
      supportEmail: String,
      supportPhone: String,
      pickupAddress: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
      onboardingStatus: {
        type: String,
        default: "initiated",
      },
      onboardingChecklist: {
        profileCompleted: { type: Boolean, default: false },
        kycSubmitted: { type: Boolean, default: false },
        gstVerified: { type: Boolean, default: false },
        bankLinked: { type: Boolean, default: false },
        firstProductPublished: { type: Boolean, default: false },
      },
    },
    sellerSettings: {
      autoAcceptOrders: { type: Boolean, default: false },
      handlingTimeHours: { type: Number, default: 24 },
      returnWindowDays: { type: Number, default: 7 },
      ndrResponseHours: { type: Number, default: 24 },
      shippingModes: [{ type: String }],
      payoutSchedule: {
        type: String,
        default: "weekly",
      },
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
