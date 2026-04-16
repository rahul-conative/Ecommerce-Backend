const express = require("express");
const { AnalyticsController } = require("../controllers/analytics.controller");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const { trackEventSchema } = require("../validation/analytics.validation");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { authorizeCapability } = require("../../../shared/middleware/authorize");
const { CAPABILITIES } = require("../../../shared/constants/capabilities");

const analyticsRoutes = express.Router();
const analyticsController = new AnalyticsController();

analyticsRoutes.get(
  "/",
  authenticate,
  authorizeCapability(CAPABILITIES.ANALYTICS_VIEW),
  asyncHandler(analyticsController.list),
);
analyticsRoutes.post(
  "/events",
  authenticate,
  authorizeCapability(CAPABILITIES.ANALYTICS_VIEW),
  validateRequest(trackEventSchema),
  asyncHandler(analyticsController.track),
);

module.exports = { analyticsRoutes };
