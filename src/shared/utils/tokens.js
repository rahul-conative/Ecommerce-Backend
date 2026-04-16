const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { v4: uuidv4 } = require("uuid");

function generateAccessToken(payload) {
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl });
}

function generateRefreshToken(payload) {
  return jwt.sign({ ...payload, sessionId: uuidv4() }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshTtl });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken };
