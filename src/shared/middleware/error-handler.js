const { errorResponse } = require("../http/response");

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  req.log?.error({ err: error }, "Unhandled request error");

  res.status(statusCode).json(errorResponse(error.message || "Internal server error", error.details));
}

module.exports = { errorHandler };
