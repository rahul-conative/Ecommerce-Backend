function buildRequestContext(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get("user-agent") || "unknown",
    requestId: req.id || null,
    platform: req.get("x-client-platform") || "unknown",
  };
}

module.exports = { buildRequestContext };
