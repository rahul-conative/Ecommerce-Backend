const Razorpay = require("razorpay");
const crypto = require("crypto");
const { env } = require("../../config/env");
const { AppError } = require("../../shared/errors/app-error");

let razorpayClient = null;

function getRazorpayClient() {
  if (razorpayClient) {
    return razorpayClient;
  }

  if (!env.razorpay.keyId || !env.razorpay.keySecret) {
    throw new AppError("Razorpay is not configured", 503);
  }

  razorpayClient = new Razorpay({
    key_id: env.razorpay.keyId,
    key_secret: env.razorpay.keySecret,
  });

  return razorpayClient;
}

function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

function verifyRazorpayWebhookSignature(rawBody, signature) {
  const expectedSignature = crypto
    .createHmac("sha256", env.razorpay.webhookSecret)
    .update(rawBody)
    .digest("hex");

  return expectedSignature === signature;
}

module.exports = {
  getRazorpayClient,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
};
