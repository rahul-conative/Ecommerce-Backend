const { ROLE_CAPABILITIES } = require("../constants/access-policies");

function hasCapability(role, capability) {
  const capabilities = ROLE_CAPABILITIES[role] || [];
  return capabilities.includes("*") || capabilities.includes(capability);
}

module.exports = { hasCapability };
