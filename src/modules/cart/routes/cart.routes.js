const express = require("express");
const { CartController } = require("../controllers/cart.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const { upsertCartSchema } = require("../validation/cart.validation");

const cartRoutes = express.Router();
const cartController = new CartController();

cartRoutes.get("/me", authenticate, asyncHandler(cartController.getMyCart));
cartRoutes.put(
  "/me",
  authenticate,
  validateRequest(upsertCartSchema),
  asyncHandler(cartController.upsertMyCart),
);

module.exports = { cartRoutes };
