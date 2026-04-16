function successResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta,
  };
}

function errorResponse(message, details = null) {
  return {
    success: false,
    error: {
      message,
      details,
    },
  };
}

module.exports = { successResponse, errorResponse };
