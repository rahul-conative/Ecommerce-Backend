const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const referralSchema = new mongoose.Schema(
  {
    referrerUserId: { type: String, required: true, index: true },
    refereeUserId: { type: String, required: true, unique: true, index: true },
    referralCode: { type: String, required: true, index: true },
    referrerRewardAmount: { type: Number, required: true },
    refereeRewardAmount: { type: Number, required: true },
    status: { type: String, default: "rewarded", index: true },
  },
  { timestamps: true },
);

const ReferralModel = mongoose.model("Referral", referralSchema);

module.exports = { ReferralModel };
