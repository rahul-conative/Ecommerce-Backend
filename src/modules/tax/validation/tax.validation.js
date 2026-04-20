const Joi = require("joi");

const generateOrderInvoiceSchema = Joi.object({
  body: Joi.object({}).required(),
  query: Joi.object({}).required(),
  params: Joi.object({
    orderId: Joi.string().required(),
  }).required(),
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

module.exports = {
  generateOrderInvoiceSchema,
  taxReportSchema,
};

