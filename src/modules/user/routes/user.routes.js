const express = require("express");
const { UserController } = require("../controllers/user.controller");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const { authorizeCapability } = require("../../../shared/middleware/authorize");
const { CAPABILITIES } = require("../../../shared/constants/capabilities");
const {
  updateProfileSchema,
  submitUserKycSchema,
  reviewUserKycSchema,
} = require("../validation/user.validation");

const userRoutes = express.Router();
const userController = new UserController();

userRoutes.get("/me", authenticate, asyncHandler(userController.getMe));
userRoutes.patch(
  "/me",
  authenticate,
  validateRequest(updateProfileSchema),
  asyncHandler(userController.updateMe),
);
userRoutes.post(
  "/me/kyc",
  authenticate,
  authorizeCapability(CAPABILITIES.USER_KYC_SUBMIT),
  validateRequest(submitUserKycSchema),
  asyncHandler(userController.submitKyc),
);
userRoutes.patch(
  "/:userId/kyc/review",
  authenticate,
  authorizeCapability(CAPABILITIES.KYC_REVIEW),
  validateRequest(reviewUserKycSchema),
  asyncHandler(userController.reviewKyc),
);

module.exports = { userRoutes };
