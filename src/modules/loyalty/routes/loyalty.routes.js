const express = require("express");
const { authenticateToken } = require("../../../shared/middleware/auth.middleware");
const { LoyaltyService } = require("../services/loyalty.service");
const { loyaltyValidation } = require("../../validation");

const router = express.Router();

// Get loyalty profile
router.get("/profile", authenticateToken, async (req, res, next) => {
  try {
    const loyalty = await LoyaltyService.getOrCreateLoyalty(req.auth.sub);
    res.json(loyalty);
  } catch (error) {
    next(error);
  }
});

// Get tier benefits
router.get("/benefits", authenticateToken, async (req, res, next) => {
  try {
    const loyalty = await LoyaltyService.getOrCreateLoyalty(req.auth.sub);
    const benefits = await LoyaltyService.getTierBenefits(loyalty.tier);
    res.json(benefits);
  } catch (error) {
    next(error);
  }
});

// Add points to loyalty balance
router.post("/points", authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = loyaltyValidation.addPoints.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });

    const loyalty = await LoyaltyService.addPoints(
      req.auth.sub,
      value.points,
      value.reason,
      value.expiresAt,
      value.transactionId,
    );

    res.json(loyalty);
  } catch (error) {
    next(error);
  }
});

// Get points transaction history
router.get("/history", authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = loyaltyValidation.getPointsHistory.validate(req.query);
    if (error) return res.status(400).json({ error: error.details });

    const history = await LoyaltyService.getPointsHistory(req.auth.sub, value);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Redeem points
router.post("/redeem", authenticateToken, async (req, res, next) => {
  try {
    const { error, value } = loyaltyValidation.redeemPoints.validate(req.body);
    if (error) return res.status(400).json({ error: error.details });

    const loyalty = await LoyaltyService.redeemPoints(req.auth.sub, value.points);
    res.json(loyalty);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
