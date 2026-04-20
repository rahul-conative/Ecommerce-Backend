const Joi = require("joi");
const { PRODUCT_STATUS } = require("../../../shared/domain/commerce-constants");

const createProductSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(3).max(120).required(),
    description: Joi.string().min(10).required(),
    price: Joi.number().positive().required(),
    mrp: Joi.number().positive().required(),
    category: Joi.string().required(),
    attributes: Joi.object().default({}),
    stock: Joi.number().integer().min(0).required(),
    images: Joi.array().items(Joi.string().uri()).default([]),
    status: Joi.string()
      .valid(...Object.values(PRODUCT_STATUS))
      .default(PRODUCT_STATUS.DRAFT),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const listProductSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    category: Joi.string(),
    status: Joi.string(),
  }).required(),
  params: Joi.object({}).required(),
});

const searchProductSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({
    q: Joi.string().min(2).required(),
  }).required(),
  params: Joi.object({}).required(),
});

const reviewProductSchema = Joi.object({
  body: Joi.object({
    status: Joi.string()
      .valid(PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE, PRODUCT_STATUS.REJECTED)
      .required(),
    rejectionReason: Joi.string().max(500).allow("", null),
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

module.exports = { createProductSchema, listProductSchema, searchProductSchema, reviewProductSchema };
