const express = require("express");
const { NotificationController } = require("../controllers/notification.controller");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const { createNotificationSchema } = require("../validation/notification.validation");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { authorizeCapability } = require("../../../shared/middleware/authorize");
const { CAPABILITIES } = require("../../../shared/constants/capabilities");

const notificationRoutes = express.Router();
const notificationController = new NotificationController();

notificationRoutes.get("/me", authenticate, asyncHandler(notificationController.listMine));
notificationRoutes.post(
  "/",
  authenticate,
  authorizeCapability(CAPABILITIES.NOTIFICATION_MANAGE),
  validateRequest(createNotificationSchema),
  asyncHandler(notificationController.create),
);

module.exports = { notificationRoutes };
