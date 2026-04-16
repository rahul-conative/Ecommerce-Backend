const bcrypt = require("bcryptjs");

async function hashValue(value) {
  return bcrypt.hash(value, 12);
}

async function compareValue(value, hashedValue) {
  return bcrypt.compare(value, hashedValue);
}

module.exports = { hashValue, compareValue };
