const express = require("express");
const router = express.Router();

const {
  authenticateToken,
  authorizeRole,
} = require("../../../shared/middleware/auth.middleware");

const { CommissionService } = require("../services/commission.service");
const { commissionValidation } = require("../../validation");

// ==============================
// Seller: View commission breakdown
// ==============================
router.get("/my-commissions", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const commissions = await CommissionService.getSellerCommissions(userId);

    return res.status(200).json({
      success: true,
      data: commissions,
    });
  } catch (err) {
    next(err);
  }
});

// ==============================
// Seller: View payout history
// ==============================
router.get("/my-payouts", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const payouts = await CommissionService.getSellerPayouts(userId);

    return res.status(200).json({
      success: true,
      data: payouts,
    });
  } catch (err) {
    next(err);
  }
});

// ==============================
// Admin: Calculate commission for order
// ==============================
router.post(
  "/calculate/:orderId",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res, next) => {
    try {
      const { error, value } =
        commissionValidation.calculateCommission.validate(req.params);

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details,
        });
      }

      const commission = await CommissionService.calculateCommission(
        value.orderId
      );

      return res.status(200).json({
        success: true,
        message: "Commission calculated",
        data: commission,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==============================
// Admin: Process batch payouts
// ==============================
router.post(
  "/process-payouts",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res, next) => {
    try {
      const { error, value } =
        commissionValidation.processPayouts.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details,
        });
      }

      const result = await CommissionService.processBatchPayouts(
        value.sellerId
      );

      return res.status(200).json({
        success: true,
        message: "Payouts processed successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==============================
// Admin: View settlements
// ==============================
router.get(
  "/settlements",
  authenticateToken,
  authorizeRole(["admin"]),
  async (req, res, next) => {
    try {
      const settlements = await CommissionService.getSettlements();

      return res.status(200).json({
        success: true,
        data: settlements,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;