const express = require("express");
const { AuthController } = require("../controllers/auth.controller");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { authRateLimit } = require("../../../shared/middleware/auth-rate-limit");
const {
  loginSchema,
  refreshSchema,
  registerSchema,
  socialLoginSchema,
} = require("../validation/auth.validation");

const authRoutes = express.Router();
const authController = new AuthController();

authRoutes.use(authRateLimit);
authRoutes.post("/register", validateRequest(registerSchema), asyncHandler(authController.register));
authRoutes.post("/login", validateRequest(loginSchema), asyncHandler(authController.login));
authRoutes.post("/social", validateRequest(socialLoginSchema), asyncHandler(authController.socialLogin));
authRoutes.post("/refresh", validateRequest(refreshSchema), asyncHandler(authController.refresh));

module.exports = { authRoutes };
