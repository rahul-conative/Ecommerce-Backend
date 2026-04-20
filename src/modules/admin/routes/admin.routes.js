const express = require("express");
const { AdminController } = require("../controllers/admin.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { authorize } = require("../../../shared/middleware/authorize");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const { ROLES } = require("../../../shared/constants/roles");
const {
  adminOverviewSchema,
  listVendorsSchema,
  updateVendorStatusSchema,
  moderationQueueSchema,
  moderateProductSchema,
  listOrdersSchema,
  listPaymentsSchema,
  createPayoutSchema,
  listPayoutsSchema,
  taxReportSchema,
  generateInvoiceSchema,
} = require("../validation/admin.validation");

const adminRoutes = express.Router();
const adminController = new AdminController();

adminRoutes.use(authenticate, authorize(ROLES.ADMIN));

adminRoutes.get("/dashboard/overview", validateRequest(adminOverviewSchema), asyncHandler(adminController.overview));
adminRoutes.get("/vendors", validateRequest(listVendorsSchema), asyncHandler(adminController.listVendors));
adminRoutes.patch(
  "/vendors/:sellerId/status",
  validateRequest(updateVendorStatusSchema),
  asyncHandler(adminController.updateVendorStatus),
);
adminRoutes.get(
  "/products/moderation-queue",
  validateRequest(moderationQueueSchema),
  asyncHandler(adminController.moderationQueue),
);
adminRoutes.patch(
  "/products/:productId/moderate",
  validateRequest(moderateProductSchema),
  asyncHandler(adminController.moderateProduct),
);
adminRoutes.get("/orders", validateRequest(listOrdersSchema), asyncHandler(adminController.listOrders));
adminRoutes.get("/payments", validateRequest(listPaymentsSchema), asyncHandler(adminController.listPayments));
adminRoutes.post("/payouts", validateRequest(createPayoutSchema), asyncHandler(adminController.createPayout));
adminRoutes.get("/payouts", validateRequest(listPayoutsSchema), asyncHandler(adminController.listPayouts));
adminRoutes.get("/tax/reports", validateRequest(taxReportSchema), asyncHandler(adminController.taxReport));
adminRoutes.post(
  "/tax/orders/:orderId/invoice",
  validateRequest(generateInvoiceSchema),
  asyncHandler(adminController.generateInvoice),
);

module.exports = { adminRoutes };

