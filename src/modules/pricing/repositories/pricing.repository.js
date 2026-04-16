const { CouponModel } = require("../models/coupon.model");

class PricingRepository {
  async createCoupon(payload) {
    return CouponModel.create(payload);
  }

  async findCouponByCode(code) {
    return CouponModel.findOne({ code: code.toUpperCase() });
  }

  async incrementCouponUsage(couponId) {
    return CouponModel.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } }, { new: true });
  }

  async listCoupons() {
    return CouponModel.find({}).sort({ createdAt: -1 });
  }
}

module.exports = { PricingRepository };
