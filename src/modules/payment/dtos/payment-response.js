function mapPaymentResponse(payment) {
  return {
    id: payment.id,
    orderId: payment.orderId || payment.order_id,
    buyerId: payment.buyerId || payment.buyer_id,
    provider: payment.provider,
    status: payment.status,
    amount: Number(payment.amount),
    currency: payment.currency,
    transactionReference: payment.transactionReference || payment.transaction_reference,
    providerOrderId: payment.providerOrderId || payment.provider_order_id,
    providerPaymentId: payment.providerPaymentId || payment.provider_payment_id,
    verificationMethod: payment.verificationMethod || payment.verification_method,
    metadata: payment.metadata || {},
    verifiedAt: payment.verifiedAt || payment.verified_at || null,
    failedReason: payment.failedReason || payment.failed_reason || null,
    checkout: payment.checkout || null,
    createdAt: payment.createdAt || payment.created_at || null,
  };
}

module.exports = { mapPaymentResponse };
