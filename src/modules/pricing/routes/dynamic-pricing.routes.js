const express = require("express");
const router = express.Router();

const {
  authenticateToken,
  requireRole,
} = require("../../../shared/middleware/auth.middleware");

const { DynamicPricingService } = require("../services/dynamic-pricing.service");
const { dynamicPricingValidation } = require("../../validation");
const { LoyaltyService } = require("../../loyalty/services/loyalty.service");

// ==============================
// Get price for product (Customer)
// ==============================
router.get("/price", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { error, value } =
      dynamicPricingValidation.getPriceForProduct.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details,
      });
    }

    // Get user loyalty tier
    const loyalty = await LoyaltyService.getOrCreateLoyalty(userId);

    const price = await DynamicPricingService.getPriceForProduct(
      value.productId,
      loyalty?.tier || "standard",
      value.quantity
    );

    return res.status(200).json({
      success: true,
      data: { price },
    });
  } catch (err) {
    next(err);
  }
});

// ==============================
// Admin: Adjust product price
// ==============================
router.post(
  "/adjust",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res, next) => {
    try {
      const userId = req.auth?.sub;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { error, value } =
        dynamicPricingValidation.adjustPrice.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details,
        });
      }

      const result = await DynamicPricingService.adjustPrice(
        value.productId,
        value.newPrice,
        value.reason
      );

      return res.status(200).json({
        success: true,
        message: "Price adjusted successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;