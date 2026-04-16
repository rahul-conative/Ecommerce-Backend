const { PaymentRepository } = require("../repositories/payment.repository");
const { buildDomainEvent } = require("../../../contracts/events/event-factory");
const { DOMAIN_EVENTS } = require("../../../contracts/events/domain-events");
const { PAYMENT_STATUS } = require("../../../shared/domain/commerce-constants");
const { paymentProviderRegistry } = require("../../../infrastructure/payments/provider-registry");
const { AppError } = require("../../../shared/errors/app-error");
const { mapPaymentResponse } = require("../dtos/payment-response");
const { OrderRepository } = require("../../order/repositories/order.repository");

class PaymentService {
  constructor({
    paymentRepository = new PaymentRepository(),
    orderRepository = new OrderRepository(),
  } = {}) {
    this.paymentRepository = paymentRepository;
    this.orderRepository = orderRepository;
  }

  async initiatePayment(payload, actor) {
    const order = await this.orderRepository.findByIdAndBuyer(payload.orderId, actor.userId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const payableAmount = Number(order.payable_amount ?? order.total_amount);
    if (payableAmount <= 0) {
      throw new AppError("This order does not require external payment", 400);
    }

    const provider = paymentProviderRegistry.get(payload.provider);
    const providerOrder = await provider.createOrder({
      amount: payableAmount,
      currency: payload.currency || order.currency,
      receipt: `order_${payload.orderId}_${Date.now()}`,
      notes: {
        orderId: payload.orderId,
        buyerId: actor.userId,
        ...payload.notes,
      },
    });

    const paymentEvent = buildDomainEvent(
      DOMAIN_EVENTS.PAYMENT_INITIATED_V1,
      {
        buyerId: actor.userId,
        orderId: payload.orderId,
        provider: payload.provider,
        amount: payableAmount,
        currency: payload.currency || order.currency || "INR",
        providerOrderId: providerOrder.providerOrderId,
      },
      {
        source: "payment-module",
      },
    );

    const payment = await this.paymentRepository.createPayment(
      {
        ...payload,
        buyerId: actor.userId,
        status: PAYMENT_STATUS.INITIATED,
        amount: payableAmount,
        currency: payload.currency || order.currency || "INR",
        providerOrderId: providerOrder.providerOrderId,
        metadata: providerOrder.metadata,
      },
      paymentEvent,
    );

    return mapPaymentResponse({
      ...payment,
      checkout: providerOrder.checkout,
    });
  }

  async verifyPayment(payload, actor) {
    const payment = await this.paymentRepository.findByOrderId(payload.orderId, actor.userId);
    if (!payment) {
      throw new AppError("Payment record not found for this order", 404);
    }

    const provider = paymentProviderRegistry.get(payload.provider);
    const verification = await provider.verifyPayment(payload);
    const paymentEvent = buildDomainEvent(
      DOMAIN_EVENTS.PAYMENT_VERIFIED_V1,
      {
        buyerId: actor.userId,
        orderId: payload.orderId,
        paymentId: payment.id,
        provider: payment.provider,
        providerPaymentId: verification.providerPaymentId,
        providerOrderId: verification.providerOrderId,
      },
      {
        source: "payment-module",
      },
    );

    const updatedPayment = await this.paymentRepository.updatePaymentStatus(
      payment.id,
      {
        status: verification.status,
        providerPaymentId: verification.providerPaymentId,
        verificationMethod: verification.verificationMethod,
        metadata: verification.metadata,
        verifiedAt: new Date(),
      },
      paymentEvent,
    );

    return mapPaymentResponse(updatedPayment);
  }

  async handleWebhook(signature, rawBody) {
    const { verifyRazorpayWebhookSignature } = require("../../../infrastructure/payments/razorpay-client");
    if (!signature || !rawBody) {
      throw new AppError("Invalid Razorpay webhook request", 400);
    }

    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      throw new AppError("Invalid Razorpay webhook signature", 401);
    }

    const payload = JSON.parse(rawBody.toString("utf8"));
    const eventType = payload.event;

    if (eventType === "payment.captured") {
      const entity = payload.payload.payment.entity;
      const payment = await this.paymentRepository.findByProviderOrderId(entity.order_id);
      if (!payment) {
        return { acknowledged: true, ignored: true };
      }

      const paymentEvent = buildDomainEvent(
        DOMAIN_EVENTS.PAYMENT_VERIFIED_V1,
        {
          buyerId: payment.buyer_id,
          orderId: payment.order_id,
          paymentId: payment.id,
          provider: payment.provider,
          providerPaymentId: entity.id,
          providerOrderId: entity.order_id,
        },
        {
          source: "payment-webhook",
        },
      );

      await this.paymentRepository.updatePaymentStatus(
        payment.id,
        {
          status: PAYMENT_STATUS.CAPTURED,
          providerPaymentId: entity.id,
          verificationMethod: "webhook",
          metadata: entity,
          verifiedAt: new Date(),
        },
        paymentEvent,
      );
    }

    if (eventType === "payment.failed") {
      const entity = payload.payload.payment.entity;
      const payment = await this.paymentRepository.findByProviderOrderId(entity.order_id);
      if (!payment) {
        return { acknowledged: true, ignored: true };
      }

      const paymentEvent = buildDomainEvent(
        DOMAIN_EVENTS.PAYMENT_FAILED_V1,
        {
          buyerId: payment.buyer_id,
          orderId: payment.order_id,
          paymentId: payment.id,
          provider: payment.provider,
          providerPaymentId: entity.id,
          reason: entity.error_description || entity.error_reason || "payment_failed",
        },
        {
          source: "payment-webhook",
        },
      );

      await this.paymentRepository.updatePaymentStatus(
        payment.id,
        {
          status: PAYMENT_STATUS.FAILED,
          providerPaymentId: entity.id,
          verificationMethod: "webhook",
          metadata: entity,
          failedReason: entity.error_description || entity.error_reason || "payment_failed",
        },
        paymentEvent,
      );
    }

    return { acknowledged: true };
  }

  async listPayments(actor) {
    const payments = await this.paymentRepository.listPaymentsByBuyer(actor.userId);
    return payments.map(mapPaymentResponse);
  }
}

module.exports = { PaymentService };
