const Joi = require("joi");

const createOrderSchema = Joi.object({
  body: Joi.object({
    currency: Joi.string().default("INR"),
    couponCode: Joi.string().trim().uppercase().allow("", null),
    walletAmount: Joi.number().min(0).default(0),
    shippingAddress: Joi.object({
      line1: Joi.string().required(),
      line2: Joi.string().allow("", null),
      city: Joi.string().required(),
      state: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().required(),
    }).required(),
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
        }),
      )
      .min(1)
      .required(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const updateOrderStatusSchema = Joi.object({
  body: Joi.object({
    status: Joi.string()
      .valid("cancelled", "packed", "shipped", "delivered", "fulfilled", "return_requested", "returned")
      .required(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    orderId: Joi.string().required(),
  }).required(),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };
