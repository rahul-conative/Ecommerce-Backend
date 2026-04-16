const express = require("express");
const { ProductController } = require("../controllers/product.controller");
const { asyncHandler } = require("../../../shared/middleware/async-handler");
const { authenticate } = require("../../../shared/middleware/authenticate");
const { authorizeCapability } = require("../../../shared/middleware/authorize");
const { validateRequest } = require("../../../shared/middleware/validate-request");
const {
  createProductSchema,
  listProductSchema,
  searchProductSchema,
} = require("../validation/product.validation");
const { CAPABILITIES } = require("../../../shared/constants/capabilities");

const productRoutes = express.Router();
const productController = new ProductController();

productRoutes.get("/", validateRequest(listProductSchema), asyncHandler(productController.list));
productRoutes.get("/search", validateRequest(searchProductSchema), asyncHandler(productController.search));
productRoutes.get("/:productId", asyncHandler(productController.getOne));
productRoutes.post(
  "/",
  authenticate,
  authorizeCapability(CAPABILITIES.CATALOG_MANAGE),
  validateRequest(createProductSchema),
  asyncHandler(productController.create),
);

module.exports = { productRoutes };
