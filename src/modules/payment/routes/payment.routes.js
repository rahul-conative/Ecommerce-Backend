const express = require("express");
const { PaymentController } = require("../controllers/payment.controller");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const { createPaymentSchema, verifyPaymentSchema } = require("../validation/payment.validation");

const paymentRoutes = express.Router();
const paymentController = new PaymentController();

paymentRoutes.post(
  "/webhooks/razorpay",
  asyncHandler(paymentController.webhook),
);
paymentRoutes.get("/me", authenticate, asyncHandler(paymentController.listMine));
paymentRoutes.post(
  "/initiate",
  authenticate,
  validateRequest(createPaymentSchema),
  asyncHandler(paymentController.initiate),
);
paymentRoutes.post(
  "/verify",
  authenticate,
  validateRequest(verifyPaymentSchema),
  asyncHandler(paymentController.verify),
);

module.exports = { paymentRoutes };
