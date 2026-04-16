const { PAYMENT_STATUS } = require("../../../shared/domain/commerce-constants");
const {
  getRazorpayClient,
  verifyRazorpaySignature,
} = require("../razorpay-client");
const { AppError } = require("../../../shared/errors/app-error");
const { env } = require("../../../config/env");

class RazorpayProvider {
  async createOrder(payload) {
    const client = getRazorpayClient();
    const order = await client.orders.create({
      amount: Math.round(Number(payload.amount) * 100),
      currency: payload.currency || "INR",
      receipt: payload.receipt,
      notes: payload.notes || {},
    });

    return {
      providerOrderId: order.id,
      amount: Number(order.amount) / 100,
      currency: order.currency,
      metadata: order,
      checkout: {
        keyId: env.razorpay.keyId,
        amount: order.amount,
        currency: order.currency,
        orderId: order.id,
      },
    };
  }

  async verifyPayment(payload) {
    const isValid = verifyRazorpaySignature({
      orderId: payload.razorpayOrderId,
      paymentId: payload.razorpayPaymentId,
      signature: payload.razorpaySignature,
    });

    if (!isValid) {
      throw new AppError("Invalid Razorpay payment signature", 401);
    }

    return {
      status: PAYMENT_STATUS.CAPTURED,
      providerPaymentId: payload.razorpayPaymentId,
      providerOrderId: payload.razorpayOrderId,
      verificationMethod: "signature",
      metadata: {
        razorpaySignature: payload.razorpaySignature,
      },
    };
  }
}

module.exports = { RazorpayProvider };
