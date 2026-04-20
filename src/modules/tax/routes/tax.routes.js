const express = require("express");
const { TaxController } = require("../controllers/tax.controller");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { authorize } = require("../../../shared/middleware/authorize");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const { ROLES } = require("../../../shared/constants/roles");
const { generateOrderInvoiceSchema, taxReportSchema } = require("../validation/tax.validation");

const taxRoutes = express.Router();
const taxController = new TaxController();

taxRoutes.post(
  "/orders/:orderId/invoice",
  authenticate,
  authorize(ROLES.ADMIN),
  validateRequest(generateOrderInvoiceSchema),
  asyncHandler(taxController.generateOrderInvoice),
);

taxRoutes.get(
  "/reports",
  authenticate,
  authorize(ROLES.ADMIN),
  validateRequest(taxReportSchema),
  asyncHandler(taxController.getReport),
);

module.exports = { taxRoutes };

