const express = require("express");
const { SellerController } = require("../controllers/seller.controller");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { authorizeCapability } = require("../../../shared/middleware/authorize");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const {
  submitKycSchema,
  reviewSellerKycSchema,
  updateSellerProfileSchema,
  updateSellerSettingsSchema,
  sellerDashboardSchema,
} = require("../validation/seller.validation");
const { CAPABILITIES } = require("../../../shared/constants/capabilities");

const sellerRoutes = express.Router();
const sellerController = new SellerController();

sellerRoutes.post(
  "/kyc",
  authenticate,
  authorizeCapability(CAPABILITIES.SELLER_KYC_SUBMIT),
  validateRequest(submitKycSchema),
  asyncHandler(sellerController.submitKyc),
);
sellerRoutes.patch(
  "/:sellerId/kyc/review",
  authenticate,
  authorizeCapability(CAPABILITIES.KYC_REVIEW),
  validateRequest(reviewSellerKycSchema),
  asyncHandler(sellerController.reviewKyc),
);
sellerRoutes.patch(
  "/me/profile",
  authenticate,
  authorizeCapability(CAPABILITIES.SELLER_PROFILE_MANAGE),
  validateRequest(updateSellerProfileSchema),
  asyncHandler(sellerController.updateProfile),
);
sellerRoutes.patch(
  "/me/settings",
  authenticate,
  authorizeCapability(CAPABILITIES.SELLER_PROFILE_MANAGE),
  validateRequest(updateSellerSettingsSchema),
  asyncHandler(sellerController.updateSettings),
);
sellerRoutes.get(
  "/me/dashboard",
  authenticate,
  authorizeCapability(CAPABILITIES.SELLER_DASHBOARD_VIEW),
  validateRequest(sellerDashboardSchema),
  asyncHandler(sellerController.dashboard),
);

module.exports = { sellerRoutes };
