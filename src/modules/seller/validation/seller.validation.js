const Joi = require("joi");
const { panPattern, gstPattern, aadhaarPattern } = require("../../../shared/validation/kyc");
const { KYC_STATUS } = require("../../../shared/domain/commerce-constants");

const submitKycSchema = Joi.object({
  body: Joi.object({
    panNumber: Joi.string().pattern(panPattern).required(),
    gstNumber: Joi.string().pattern(gstPattern).allow("", null),
    aadhaarNumber: Joi.string().pattern(aadhaarPattern).allow("", null),
    legalName: Joi.string().min(2).max(120).required(),
    businessType: Joi.string().valid("individual", "proprietorship", "partnership", "private_limited"),
    documents: Joi.object({
      panDocumentUrl: Joi.string().uri().allow("", null),
      gstCertificateUrl: Joi.string().uri().allow("", null),
      aadhaarFrontUrl: Joi.string().uri().allow("", null),
      aadhaarBackUrl: Joi.string().uri().allow("", null),
      bankProofUrl: Joi.string().uri().allow("", null),
    }).default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const reviewSellerKycSchema = Joi.object({
  body: Joi.object({
    verificationStatus: Joi.string()
      .valid(KYC_STATUS.UNDER_REVIEW, KYC_STATUS.VERIFIED, KYC_STATUS.REJECTED)
      .required(),
    rejectionReason: Joi.string().allow("", null),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    sellerId: Joi.string().required(),
  }).required(),
});

const updateSellerProfileSchema = Joi.object({
  body: Joi.object({
    displayName: Joi.string().min(2).max(120).required(),
    legalBusinessName: Joi.string().min(2).max(160).required(),
    description: Joi.string().max(2000).allow("", null),
    supportEmail: Joi.string().email().required(),
    supportPhone: Joi.string().min(10).max(15).required(),
    pickupAddress: Joi.object({
      line1: Joi.string().required(),
      line2: Joi.string().allow("", null),
      city: Joi.string().required(),
      state: Joi.string().required(),
      country: Joi.string().default("India"),
      postalCode: Joi.string().min(5).max(10).required(),
    }).required(),
    onboardingChecklist: Joi.object({
      profileCompleted: Joi.boolean(),
      kycSubmitted: Joi.boolean(),
      gstVerified: Joi.boolean(),
      bankLinked: Joi.boolean(),
      firstProductPublished: Joi.boolean(),
    }).default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateSellerSettingsSchema = Joi.object({
  body: Joi.object({
    autoAcceptOrders: Joi.boolean(),
    handlingTimeHours: Joi.number().integer().min(1).max(168),
    returnWindowDays: Joi.number().integer().min(1).max(60),
    ndrResponseHours: Joi.number().integer().min(1).max(72),
    shippingModes: Joi.array().items(Joi.string().valid("standard", "express", "same_day", "hyperlocal")),
    payoutSchedule: Joi.string().valid("daily", "weekly", "biweekly", "monthly"),
  })
    .min(1)
    .required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const sellerDashboardSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso(),
  }).required(),
  params: Joi.object({}).required(),
});

module.exports = {
  submitKycSchema,
  reviewSellerKycSchema,
  updateSellerProfileSchema,
  updateSellerSettingsSchema,
  sellerDashboardSchema,
};
