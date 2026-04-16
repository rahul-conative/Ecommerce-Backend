const Joi = require("joi");
const { PAYMENT_PROVIDER } = require("../../../shared/domain/commerce-constants");

const createPaymentSchema = Joi.object({
  body: Joi.object({
    orderId: Joi.string().required(),
    provider: Joi.string()
      .valid(...Object.values(PAYMENT_PROVIDER))
      .required(),
    amount: Joi.number().positive(),
    currency: Joi.string().default("INR"),
    notes: Joi.object().default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const verifyPaymentSchema = Joi.object({
  body: Joi.object({
    provider: Joi.string()
      .valid(PAYMENT_PROVIDER.RAZORPAY)
      .required(),
    orderId: Joi.string().required(),
    razorpayOrderId: Joi.string().required(),
    razorpayPaymentId: Joi.string().required(),
    razorpaySignature: Joi.string().required(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

module.exports = { createPaymentSchema, verifyPaymentSchema };
