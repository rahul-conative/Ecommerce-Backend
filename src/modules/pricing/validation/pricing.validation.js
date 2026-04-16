const Joi = require("joi");
const { COUPON_TYPE } = require("../../../shared/domain/commerce-constants");

const createCouponSchema = Joi.object({
  body: Joi.object({
    code: Joi.string().trim().uppercase().min(3).max(30).required(),
    type: Joi.string()
      .valid(...Object.values(COUPON_TYPE))
      .required(),
    value: Joi.number().positive().required(),
    minOrderAmount: Joi.number().min(0).default(0),
    maxDiscountAmount: Joi.number().min(0).allow(null),
    usageLimit: Joi.number().integer().min(1).allow(null),
    startsAt: Joi.date().iso().allow(null),
    expiresAt: Joi.date().iso().allow(null),
    active: Joi.boolean().default(true),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

module.exports = { createCouponSchema };
