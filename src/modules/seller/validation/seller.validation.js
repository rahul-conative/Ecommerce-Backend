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

module.exports = { submitKycSchema, reviewSellerKycSchema };
