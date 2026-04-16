const Joi = require("joi");

const trackEventSchema = Joi.object({
  body: Joi.object({
    eventName: Joi.string().required(),
    actorId: Joi.string().allow("", null),
    metadata: Joi.object().default({}),
  }).required(),
  query: Joi.object({}).required(),
  params: Joi.object({}).required(),
});

module.exports = { trackEventSchema };
