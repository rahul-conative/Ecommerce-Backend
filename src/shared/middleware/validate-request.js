const { AppError } = require("../errors/app-error");

function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
      },
    );

    if (error) {
      return next(new AppError("Validation failed", 400, error.details));
    }

    req.body = value.body || {};
    req.query = value.query || {};
    req.params = value.params || {};

    return next();
  };
}

module.exports = { validateRequest };
