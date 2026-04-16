const jwt = require("jsonwebtoken");
const { env } = require("../../config/env");
const { AppError } = require("../errors/app-error");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    req.auth = jwt.verify(token, env.jwtAccessSecret);
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
}

module.exports = { authenticate };
