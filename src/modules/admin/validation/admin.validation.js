const Joi = require("joi");
const { PRODUCT_STATUS, ORDER_STATUS, PAYMENT_STATUS } = require("../../../shared/domain/commerce-constants");

const adminOverviewSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const listVendorsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    q: Joi.string().allow(""),
    status: Joi.string().valid("active", "suspended"),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }).required(),
  params: Joi.object({}).required(),
});

const updateVendorStatusSchema = Joi.object({
  body: Joi.object({
    accountStatus: Joi.string().valid("active", "suspended").required(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    sellerId: Joi.string().required(),
  }).required(),
});

const moderationQueueSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    status: Joi.string().valid(
      PRODUCT_STATUS.PENDING_APPROVAL,
      PRODUCT_STATUS.DRAFT,
      PRODUCT_STATUS.REJECTED,
      PRODUCT_STATUS.ACTIVE,
      PRODUCT_STATUS.INACTIVE,
    ),
    category: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }).required(),
  params: Joi.object({}).required(),
});

const moderateProductSchema = Joi.object({
  body: Joi.object({
    status: Joi.string()
      .valid(PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE, PRODUCT_STATUS.REJECTED)
      .required(),
    rejectionReason: Joi.string().allow("", null),
    checklist: Joi.object({
      titleVerified: Joi.boolean(),
      categoryVerified: Joi.boolean(),
      complianceVerified: Joi.boolean(),
      mediaVerified: Joi.boolean(),
    }).default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    productId: Joi.string().required(),
  }).required(),
});

const listOrdersSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    status: Joi.string().valid(...Object.values(ORDER_STATUS)),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
    limit: Joi.number().integer().min(1).max(500),
    offset: Joi.number().integer().min(0),
  }).required(),
  params: Joi.object({}).required(),
});

const listPaymentsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    status: Joi.string().valid(...Object.values(PAYMENT_STATUS)),
    provider: Joi.string(),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
    limit: Joi.number().integer().min(1).max(500),
    offset: Joi.number().integer().min(0),
  }).required(),
  params: Joi.object({}).required(),
});

const createPayoutSchema = Joi.object({
  body: Joi.object({
    sellerId: Joi.string().required(),
    periodStart: Joi.date().iso().required(),
    periodEnd: Joi.date().iso().required(),
    grossAmount: Joi.number().positive().required(),
    commissionAmount: Joi.number().min(0),
    processingFeeAmount: Joi.number().min(0),
    taxWithheldAmount: Joi.number().min(0),
    netPayoutAmount: Joi.number().min(0),
    currency: Joi.string().default("INR"),
    status: Joi.string().valid("scheduled", "processing", "paid", "failed"),
    scheduledAt: Joi.date().iso(),
    metadata: Joi.object().default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const listPayoutsSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    sellerId: Joi.string(),
    status: Joi.string().valid("scheduled", "processing", "paid", "failed"),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
    limit: Joi.number().integer().min(1).max(500),
    offset: Joi.number().integer().min(0),
  }).required(),
  params: Joi.object({}).required(),
});

const taxReportSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
    taxComponent: Joi.string().valid("cgst", "sgst", "igst", "tcs"),
    limit: Joi.number().integer().min(1).max(1000),
    offset: Joi.number().integer().min(0),
  }).required(),
  params: Joi.object({}).required(),
});

const generateInvoiceSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    orderId: Joi.string().required(),
  }).required(),
});

module.exports = {
  adminOverviewSchema,
  listVendorsSchema,
  updateVendorStatusSchema,
  moderationQueueSchema,
  moderateProductSchema,
  listOrdersSchema,
  listPaymentsSchema,
  createPayoutSchema,
  listPayoutsSchema,
  taxReportSchema,
  generateInvoiceSchema,
};

