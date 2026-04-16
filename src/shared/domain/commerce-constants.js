const PRODUCT_STATUS = {
  DRAFT: "draft",
  ACTIVE: "active",
  INACTIVE: "inactive",
};

const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  PAYMENT_FAILED: "payment_failed",
  CONFIRMED: "confirmed",
  PACKED: "packed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  RETURN_REQUESTED: "return_requested",
  RETURNED: "returned",
  CANCELLED: "cancelled",
  FULFILLED: "fulfilled",
};

const PAYMENT_STATUS = {
  INITIATED: "initiated",
  AUTHORIZED: "authorized",
  CAPTURED: "captured",
  FAILED: "failed",
  REFUNDED: "refunded",
};

const PAYMENT_PROVIDER = {
  RAZORPAY: "razorpay",
  STRIPE: "stripe",
  COD: "cod",
};

const KYC_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

const KYC_ENTITY_TYPE = {
  SELLER: "seller",
  USER: "user",
};

const DOCUMENT_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

const COUPON_TYPE = {
  PERCENTAGE: "percentage",
  FIXED: "fixed",
};

const WALLET_TRANSACTION_TYPE = {
  CREDIT: "credit",
  DEBIT: "debit",
};

const WALLET_TRANSACTION_STATUS = {
  HELD: "held",
  COMPLETED: "completed",
  RELEASED: "released",
};

module.exports = {
  PRODUCT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_PROVIDER,
  KYC_STATUS,
  KYC_ENTITY_TYPE,
  DOCUMENT_STATUS,
  COUPON_TYPE,
  WALLET_TRANSACTION_TYPE,
  WALLET_TRANSACTION_STATUS,
};
