const express = require("express");
const { OrderController } = require("../controllers/order.controller");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const { createOrderSchema, updateOrderStatusSchema } = require("../validation/order.validation");

const orderRoutes = express.Router();
const orderController = new OrderController();

orderRoutes.get("/me", authenticate, asyncHandler(orderController.listMine));
orderRoutes.post("/", authenticate, validateRequest(createOrderSchema), asyncHandler(orderController.create));
orderRoutes.patch(
  "/:orderId/status",
  authenticate,
  validateRequest(updateOrderStatusSchema),
  asyncHandler(orderController.updateStatus),
);

module.exports = { orderRoutes };
