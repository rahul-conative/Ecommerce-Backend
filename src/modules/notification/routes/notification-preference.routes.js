const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../../../shared/middleware/auth.middleware");
const { NotificationService } = require("../services/notification.service");
const { notificationValidation } = require("../../validation");

// ==============================
// Get notification preferences
// ==============================
router.get("/preferences", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const prefs = await NotificationService.getPreferences(userId);

    return res.status(200).json({
      success: true,
      data: prefs,
    });
  } catch (err) {
    next(err);
  }
});

// ==============================
// Update notification preferences
// ==============================
router.put("/preferences", authenticateToken, async (req, res, next) => {
  try {
    const userId = req.auth?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { error, value } =
      notificationValidation.updatePreferences.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details,
      });
    }

    const prefs = await NotificationService.updatePreferences(userId, value);

    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      data: prefs,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;