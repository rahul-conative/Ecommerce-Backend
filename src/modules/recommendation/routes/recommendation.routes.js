const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../../../shared/middleware/auth.middleware");
const { RecommendationService } = require("../services/recommendation.service");
const { recommendationValidation } = require("../../validation");

// ==============================
// Get personalized recommendations
// ==============================
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    const { error, value } =
      recommendationValidation.getRecommendations.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details,
      });
    }

    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const recs = await RecommendationService.getRecommendations(userId, value);

    return res.status(200).json({
      success: true,
      data: recs,
    });
  } catch (err) {
    next(err);
  }
});

// ==============================
// Track interaction with recommendation
// ==============================
router.post(
  "/:productId/interact",
  authenticateToken,
  async (req, res, next) => {
    try {
      const { error } =
        recommendationValidation.recordInteraction.validate({
          ...req.body,
          productId: req.params.productId,
        });

      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details,
        });
      }

      const userId = req.auth?.sub;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { interactionType } = req.body;

      await RecommendationService.recordInteraction(
        userId,
        req.params.productId,
        interactionType
      );

      return res.status(200).json({
        success: true,
        message: "Interaction recorded",
      });
    } catch (err) {
      next(err);
    }
  }
);

// ==============================
// Get trending products
// ==============================
router.get("/trending", async (req, res, next) => {
  try {
    const { error, value } =
      recommendationValidation.getTrending.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details,
      });
    }

    const { category, period } = value;

    const trending = await RecommendationService.getTrendingProducts(
      category,
      period
    );

    return res.status(200).json({
      success: true,
      data: trending,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;