const { errorResponse } = require("../http/response");

function notFoundHandler(req, res) {
  res.status(404).json(errorResponse("Route not found"));
}

module.exports = { notFoundHandler };
