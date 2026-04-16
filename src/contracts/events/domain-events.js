const DOMAIN_EVENTS = {
  AUTH_USER_REGISTERED_V1: "auth.user_registered.v1",
  ORDER_CREATED_V1: "order.created.v1",
  ORDER_STATUS_UPDATED_V1: "order.status_updated.v1",
  PAYMENT_INITIATED_V1: "payment.initiated.v1",
  PAYMENT_VERIFIED_V1: "payment.verified.v1",
  PAYMENT_FAILED_V1: "payment.failed.v1",
  SELLER_KYC_SUBMITTED_V1: "seller.kyc_submitted.v1",
  USER_KYC_SUBMITTED_V1: "user.kyc_submitted.v1",
  KYC_STATUS_UPDATED_V1: "kyc.status_updated.v1",
  NOTIFICATION_CREATED_V1: "notification.created.v1",
  INVENTORY_RESERVED_V1: "inventory.reserved.v1",
  INVENTORY_RELEASED_V1: "inventory.released.v1",
  INVENTORY_COMMITTED_V1: "inventory.committed.v1",
  WALLET_RESERVED_V1: "wallet.reserved.v1",
  WALLET_CAPTURED_V1: "wallet.captured.v1",
  WALLET_RELEASED_V1: "wallet.released.v1",
  REFERRAL_REWARDED_V1: "referral.rewarded.v1",
};

module.exports = { DOMAIN_EVENTS };
