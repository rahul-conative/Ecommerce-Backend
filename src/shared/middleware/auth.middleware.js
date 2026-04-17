const { authenticate } = require("./authenticate");
const { authorize, authorizeCapability } = require("./authorize");

module.exports = {
  authenticateToken: authenticate,
  requireRole: authorize,
  authorizeRole: authorize,
  authorizeCapability,
};
