const { mongoose } = require("../../../infrastructure/mongo/mongo-client");

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    channels: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },
    eventTypes: {
      order: { type: Boolean, default: true },
      payment: { type: Boolean, default: true },
      shipping: { type: Boolean, default: true },
      promo: { type: Boolean, default: true },
      referral: { type: Boolean, default: true },
      newProduct: { type: Boolean, default: false },
    },
    frequency: { type: String, enum: ["real_time", "daily", "weekly", "never"], default: "real_time" },
    doNotDisturbStart: String, // HH:MM format
    doNotDisturbEnd: String,
    timezone: { type: String, default: "UTC" },
  },
  { timestamps: true },
);

const notificationQueueSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    type: String, // "email", "sms", "push"
    channel: String, // "order_confirmation", "shipping_update", "promotional"
    recipient: String, // email or phone
    subject: String,
    body: String,
    payload: Object,
    status: { type: String, enum: ["queued", "sent", "failed", "bounced"], default: "queued", index: true },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: Date,
    sentAt: Date,
    failureReason: String,
    scheduledFor: Date,
  },
  { timestamps: true },
);

const NotificationPreferenceModel = mongoose.model("NotificationPreference", notificationPreferenceSchema);
const NotificationQueueModel = mongoose.model("NotificationQueue", notificationQueueSchema);

module.exports = { NotificationPreferenceModel, NotificationQueueModel };
