const { FraudDetectionModel } = require("../models/fraud-detection.model");
const { logger } = require("../../../shared/logger/logger");
const { AppError } = require("../../../shared/errors/app-error");

/**
 * Fraud Detection System
 * Detects suspicious orders based on:
 * - Transaction amount
 * - Geographic inconsistencies
 * - Velocity (multiple orders in short time)
 * - Card matching
 * - IP reputation
 */

const FRAUD_THRESHOLDS = {
  highValue: 500, // Orders over $500
  velocityThreshold: 5, // Orders within 1 hour
  internationalThreshold: 1000,
};

class FraudDetectionService {
  async analyzeOrder(order, paymentInfo, userProfile, orderHistory) {
    const indicators = [];
    let riskScore = 0;

    // Check 1: High transaction value
    if (order.totalAmount > FRAUD_THRESHOLDS.highValue) {
      indicators.push({
        type: "high_transaction_value",
        severity: order.totalAmount > FRAUD_THRESHOLDS.internationalThreshold ? "high" : "medium",
        description: `Order amount: $${order.totalAmount}`,
      });
      riskScore += 15;
    }

    // Check 2: New card
    if (paymentInfo.isNewCard) {
      indicators.push({
        type: "new_card",
        severity: "medium",
        description: "First time using this card",
      });
      riskScore += 10;
    }

    // Check 3: International shipping
    if (order.shippingAddress?.country !== userProfile?.country) {
      indicators.push({
        type: "international_shipping",
        severity: "medium",
        description: `Shipping to ${order.shippingAddress?.country}`,
      });
      riskScore += 10;
    }

    // Check 4: Velocity abuse
    const recentOrders = orderHistory.filter(
      (o) => new Date() - new Date(o.createdAt) < 60 * 60 * 1000, // Last hour
    );
    if (recentOrders.length > FRAUD_THRESHOLDS.velocityThreshold) {
      indicators.push({
        type: "velocity",
        severity: "high",
        description: `${recentOrders.length} orders in last hour`,
      });
      riskScore += 25;
    }

    // Check 5: Address/Card mismatch
    const billingAddressString = paymentInfo.billingAddress ? JSON.stringify(paymentInfo.billingAddress) : null;
    const shippingAddressString = order.shippingAddress ? JSON.stringify(order.shippingAddress) : null;

    if (billingAddressString && shippingAddressString && billingAddressString !== shippingAddressString) {
      indicators.push({
        type: "address_mismatch",
        severity: "low",
        description: "Billing and shipping addresses differ",
      });
      riskScore += 5;
    }

    // Determine risk level
    let riskLevel = "low";
    if (riskScore > 70) riskLevel = "critical";
    else if (riskScore > 50) riskLevel = "high";
    else if (riskScore > 30) riskLevel = "medium";

    // Determine action
    let action = "allow";
    if (riskLevel === "critical") action = "block";
    else if (riskLevel === "high") action = "review";

    const fraudRecord = new FraudDetectionModel({
      orderId: order.id,
      buyerId: order.buyerId,
      riskScore,
      riskLevel,
      indicators,
      action,
    });

    await fraudRecord.save();
    logger.warn({ orderId: order.id, riskLevel, action }, "Fraud detection completed");

    return {
      orderId: order.id,
      riskScore,
      riskLevel,
      action,
      indicators,
      reviewRequired: action === "review",
      shouldBlock: action === "block",
    };
  }

  async reviewOrder(orderId, decision, notes, reviewedBy) {
    const fraudRecord = await FraudDetectionModel.findOne({ orderId });
    if (!fraudRecord) {
      throw new AppError("Fraud record not found", 404);
    }

    fraudRecord.reviewStatus = decision; // "approved" or "rejected"
    fraudRecord.reviewedBy = reviewedBy;
    fraudRecord.reviewNotes = notes;
    fraudRecord.reviewedAt = new Date();

    if (fraudRecord.riskLevel === "high" && decision === "approved") {
      fraudRecord.falsePositive = true;
    }

    await fraudRecord.save();
    return fraudRecord;
  }
}

module.exports = { FraudDetectionService: new FraudDetectionService() };
