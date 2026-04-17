const { ReturnModel } = require("../models/return.model");
const { logger } = require("../../../shared/logger/logger");
const { AppError } = require("../../../shared/errors/app-error");

/**
 * Return/RMA Management
 * Workflow: requested → approved → shipped_back → received → refunded
 */

const VALID_TRANSITIONS = {
  requested: ["approved", "rejected"],
  approved: ["shipped_back"],
  shipped_back: ["received"],
  received: ["refunded"],
};

class ReturnService {
  // ==============================
  // Helper: Fetch Return
  // ==============================
  async getReturnOrThrow(returnId) {
    const returnRequest = await ReturnModel.findById(returnId);

    if (!returnRequest) {
      throw new AppError("Return not found", 404);
    }

    return returnRequest;
  }

  // ==============================
  // Helper: Validate Transition
  // ==============================
  validateTransition(current, next) {
    if (!VALID_TRANSITIONS[current]?.includes(next)) {
      throw new AppError(
        `Invalid status transition from ${current} → ${next}`,
        400
      );
    }
  }

  // ==============================
  // Request Return
  // ==============================
  async requestReturn(orderId, buyerId, items, reason, description) {
    if (!items || items.length === 0) {
      throw new AppError("Return items required", 400);
    }

    const existing = await ReturnModel.findOne({ orderId, buyerId });
    if (existing) {
      throw new AppError("Return already requested for this order", 400);
    }

    const returnRequest = await ReturnModel.create({
      orderId,
      buyerId,
      items,
      reason,
      description,
      status: "requested",
    });

    logger.info({ orderId, returnId: returnRequest._id }, "Return requested");

    return returnRequest;
  }

  // ==============================
  // Approve Return
  // ==============================
  async approveReturn(returnId, refundAmount) {
    if (refundAmount <= 0) {
      throw new AppError("Invalid refund amount", 400);
    }

    const returnRequest = await this.getReturnOrThrow(returnId);

    this.validateTransition(returnRequest.status, "approved");

    returnRequest.status = "approved";
    returnRequest.refundAmount = refundAmount;
    returnRequest.approvedAt = new Date();

    await returnRequest.save();

    logger.info({ returnId, refundAmount }, "Return approved");

    return returnRequest;
  }

  // ==============================
  // Ship Back
  // ==============================
  async shipReturnBack(returnId, trackingNumber) {
    if (!trackingNumber) {
      throw new AppError("Tracking number required", 400);
    }

    const returnRequest = await this.getReturnOrThrow(returnId);

    this.validateTransition(returnRequest.status, "shipped_back");

    returnRequest.status = "shipped_back";
    returnRequest.trackingNumber = trackingNumber;

    await returnRequest.save();

    logger.info({ returnId, trackingNumber }, "Return shipped back");

    return returnRequest;
  }

  // ==============================
  // Receive Return
  // ==============================
  async receiveReturn(returnId, notes) {
    const returnRequest = await this.getReturnOrThrow(returnId);

    this.validateTransition(returnRequest.status, "received");

    returnRequest.status = "received";
    returnRequest.notes = notes;

    await returnRequest.save();

    logger.info({ returnId }, "Return received");

    return returnRequest;
  }

  // ==============================
  // Process Refund
  // ==============================
  async processRefund(returnId) {
    const returnRequest = await this.getReturnOrThrow(returnId);

    this.validateTransition(returnRequest.status, "refunded");

    if (returnRequest.refundedAt) {
      throw new AppError("Refund already processed", 400); // idempotency
    }

    returnRequest.status = "refunded";
    returnRequest.refundedAt = new Date();

    await returnRequest.save();

    logger.info(
      { returnId, amount: returnRequest.refundAmount },
      "Refund processed"
    );

    return returnRequest;
  }

  // ==============================
  // Reject Return
  // ==============================
  async rejectReturn(returnId, reason) {
    const returnRequest = await this.getReturnOrThrow(returnId);

    this.validateTransition(returnRequest.status, "rejected");

    returnRequest.status = "rejected";
    returnRequest.notes = reason;

    await returnRequest.save();

    logger.info({ returnId, reason }, "Return rejected");

    return returnRequest;
  }

  // ==============================
  // Get Returns by Buyer
  // ==============================
  async getReturnsByBuyer(buyerId) {
    return ReturnModel.find({ buyerId })
      .sort({ createdAt: -1 })
      .lean();
  }

  // ==============================
  // Get Return by Order
  // ==============================
  async getReturnByOrder(orderId) {
    return ReturnModel.findOne({ orderId }).lean();
  }
}

module.exports = {
  ReturnService: new ReturnService(),
};