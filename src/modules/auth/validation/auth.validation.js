const Joi = require("joi");
const { ROLES } = require("../../../shared/constants/roles");

const registerSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().min(10).max(15).required(),
    password: Joi.string().min(8).max(64).required(),
    role: Joi.string()
      .valid(...Object.values(ROLES))
      .default(ROLES.BUYER),
    profile: Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
    }).required(),
    referralCode: Joi.string().trim().uppercase().allow("", null),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const refreshSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

const socialLoginSchema = Joi.object({
  body: Joi.object({
    provider: Joi.string().valid("google", "firebase").required(),
    idToken: Joi.string().required(),
    role: Joi.string()
      .valid(...Object.values(ROLES))
      .default(ROLES.BUYER),
    referralCode: Joi.string().trim().uppercase().allow("", null),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

module.exports = { registerSchema, loginSchema, refreshSchema, socialLoginSchema };
