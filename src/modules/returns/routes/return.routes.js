const express = require("express");
const router = express.Router();

const {
  authenticateToken,
  requireRole,
} = require("../../../shared/middleware/auth.middleware");

const { ReturnService } = require("../services/return.service");
const { returnValidation } = require("../../validation");

// ==============================
// Request a return
// ==============================
router.post("/", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { error, value } =
      returnValidation.requestReturn.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details,
      });
    }

    const returnReq = await ReturnService.requestReturn(
      value.orderId,
      userId,
      value.items,
      value.reason,
      value.description
    );

    return res.status(201).json({
      success: true,
      message: "Return requested successfully",
      data: returnReq,
    });
  } catch (err) {
    next(err);
  }
});

// ==============================
// Get returns for buyer
// ==============================
router.get("/my-returns", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const returns = await ReturnService.getReturnsByBuyer(userId);

    return res.status(200).json({
      success: true,
      data: returns,
    });
  } catch (err) {
    next(err);
  }
});

// ==============================
// Get return by order
// ==============================
router.get("/order/:orderId", authenticateToken, async (req, res, next) => {
  try {
    const { error, value } =
      returnValidation.getReturnByOrder.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details,
      });
    }

    const returnReq = await ReturnService.getReturnByOrder(
      value.orderId
    );

    return res.status(200).json({
      success: true,
      data: returnReq || null,
    });
  } catch (err) {
    next(err);
  }
});

// ==============================
// Admin: Approve return
// ==============================
router.post(
  "/:returnId/approve",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res, next) => {
    try {
      const { error, value } =
        returnValidation.approveReturn.validate({
          ...req.body,
          returnId: req.params.returnId,
        });

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details,
        });
      }

      const returnReq = await ReturnService.approveReturn(
        value.returnId,
        value.refundAmount
      );

      return res.status(200).json({
        success: true,
        message: "Return approved",
        data: returnReq,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==============================
// Admin: Process refund
// ==============================
router.post(
  "/:returnId/refund",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res, next) => {
    try {
      const { error, value } =
        returnValidation.processRefund.validate(req.params);

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details,
        });
      }

      const returnReq = await ReturnService.processRefund(
        value.returnId
      );

      return res.status(200).json({
        success: true,
        message: "Refund processed successfully",
        data: returnReq,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;