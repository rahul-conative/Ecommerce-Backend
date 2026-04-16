const { AppError } = require("../../../shared/errors/app-error");
const { COUPON_TYPE } = require("../../../shared/domain/commerce-constants");
const { PricingRepository } = require("../repositories/pricing.repository");
const { ProductRepository } = require("../../product/repositories/product.repository");
const { WalletRepository } = require("../../wallet/repositories/wallet.repository");
const { env } = require("../../../config/env");

class PricingService {
  constructor({
    pricingRepository = new PricingRepository(),
    productRepository = new ProductRepository(),
    walletRepository = new WalletRepository(),
  } = {}) {
    this.pricingRepository = pricingRepository;
    this.productRepository = productRepository;
    this.walletRepository = walletRepository;
  }

  async priceOrder({ items, couponCode = null, walletAmount = 0, shippingAddress, userId }) {
    const productIds = items.map((item) => item.productId);
    const products = await this.productRepository.findByIds(productIds);
    const productMap = new Map(products.map((product) => [String(product.id), product]));

    const pricedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 404);
      }

      if (product.status !== "active") {
        throw new AppError(`Product ${item.productId} is not active`, 400);
      }

      const availableStock = product.stock - product.reservedStock;
      if (availableStock < item.quantity) {
        throw new AppError(`Insufficient stock for product ${product.title}`, 409);
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;
      return {
        productId: String(product.id),
        sellerId: product.sellerId,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        gstRate: Number(product.gstRate || 18),
        title: product.title,
      };
    });

    const subtotalAmount = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const discount = await this.calculateDiscount(couponCode, subtotalAmount);
    const taxBreakup = this.calculateTaxBreakup(
      pricedItems,
      subtotalAmount,
      discount.discountAmount,
      shippingAddress,
    );
    const walletBreakup = await this.calculateWalletUsage(userId, walletAmount, subtotalAmount);
    const totalAmount = Number(
      (subtotalAmount - discount.discountAmount + taxBreakup.totalTaxAmount).toFixed(2),
    );
    const payableAmount = Number((totalAmount - walletBreakup.walletAppliedAmount).toFixed(2));

    return {
      items: pricedItems,
      pricing: {
        subtotalAmount,
        discountAmount: discount.discountAmount,
        walletAppliedAmount: walletBreakup.walletAppliedAmount,
        taxAmount: taxBreakup.totalTaxAmount,
        taxBreakup,
        totalAmount,
        payableAmount,
        appliedCouponCode: discount.appliedCouponCode,
      },
      couponToConsume: discount.couponToConsume,
      walletToReserveAmount: walletBreakup.walletAppliedAmount,
    };
  }

  async finalizeCouponUsage(couponId) {
    if (!couponId) {
      return null;
    }

    return this.pricingRepository.incrementCouponUsage(couponId);
  }

  async createCoupon(payload) {
    return this.pricingRepository.createCoupon(payload);
  }

  async listCoupons() {
    return this.pricingRepository.listCoupons();
  }

  calculateTaxBreakup(pricedItems, subtotalAmount, discountAmount, shippingAddress = {}) {
    const isIntraState =
      String(shippingAddress?.state || "").trim().toUpperCase() ===
      String(env.commerce.businessState || "").trim().toUpperCase();

    let totalTaxAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    for (const item of pricedItems) {
      const proportion = subtotalAmount > 0 ? item.lineTotal / subtotalAmount : 0;
      const itemDiscount = Number((discountAmount * proportion).toFixed(2));
      const taxableAmount = Number((item.lineTotal - itemDiscount).toFixed(2));
      const itemTax = Number((taxableAmount * (item.gstRate / 100)).toFixed(2));
      totalTaxAmount += itemTax;

      if (isIntraState) {
        cgstAmount += Number((itemTax / 2).toFixed(2));
        sgstAmount += Number((itemTax / 2).toFixed(2));
      } else {
        igstAmount += itemTax;
      }
    }

    return {
      taxableAmount: Number((subtotalAmount - discountAmount).toFixed(2)),
      cgstAmount: Number(cgstAmount.toFixed(2)),
      sgstAmount: Number(sgstAmount.toFixed(2)),
      igstAmount: Number(igstAmount.toFixed(2)),
      totalTaxAmount: Number(totalTaxAmount.toFixed(2)),
      taxMode: isIntraState ? "cgst_sgst" : "igst",
    };
  }

  async calculateWalletUsage(userId, requestedAmount, subtotalAmount) {
    if (!userId || !requestedAmount || requestedAmount <= 0) {
      return { walletAppliedAmount: 0 };
    }

    const wallet = await this.walletRepository.findWalletByUserId(userId);
    if (!wallet) {
      return { walletAppliedAmount: 0 };
    }

    const maxWalletByPolicy = (subtotalAmount * env.commerce.maxWalletUsagePerOrderPercent) / 100;
    const walletAppliedAmount = Number(
      Math.min(Number(requestedAmount), Number(wallet.available_balance), maxWalletByPolicy).toFixed(2),
    );

    return { walletAppliedAmount };
  }

  async calculateDiscount(couponCode, subtotalAmount) {
    if (!couponCode) {
      return { discountAmount: 0, appliedCouponCode: null, couponToConsume: null };
    }

    const coupon = await this.pricingRepository.findCouponByCode(couponCode);
    if (!coupon || !coupon.active) {
      throw new AppError("Invalid coupon code", 400);
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new AppError("Coupon is not active yet", 400);
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new AppError("Coupon has expired", 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError("Coupon usage limit reached", 400);
    }

    if (subtotalAmount < coupon.minOrderAmount) {
      throw new AppError("Order does not meet coupon minimum amount", 400);
    }

    let discountAmount = 0;
    if (coupon.type === COUPON_TYPE.PERCENTAGE) {
      discountAmount = subtotalAmount * (coupon.value / 100);
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    }

    if (coupon.type === COUPON_TYPE.FIXED) {
      discountAmount = coupon.value;
    }

    discountAmount = Number(Math.min(discountAmount, subtotalAmount).toFixed(2));

    return {
      discountAmount,
      appliedCouponCode: coupon.code,
      couponToConsume: coupon.id,
    };
  }
}

module.exports = { PricingService };
