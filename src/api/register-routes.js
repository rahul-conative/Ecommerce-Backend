const { env } = require("../config/env");
const { authRoutes } = require("../modules/auth/routes/auth.routes");
const { userRoutes } = require("../modules/user/routes/user.routes");
const { productRoutes } = require("../modules/product/routes/product.routes");
const { cartRoutes } = require("../modules/cart/routes/cart.routes");
const { orderRoutes } = require("../modules/order/routes/order.routes");
const { paymentRoutes } = require("../modules/payment/routes/payment.routes");
const { sellerRoutes } = require("../modules/seller/routes/seller.routes");
const { notificationRoutes } = require("../modules/notification/routes/notification.routes");
const { analyticsRoutes } = require("../modules/analytics/routes/analytics.routes");
const { pricingRoutes } = require("../modules/pricing/routes/pricing.routes");
const { walletRoutes } = require("../modules/wallet/routes/wallet.routes");
const loyaltyRoutes = require("../modules/loyalty/routes/loyalty.routes");
const recommendationRoutes = require("../modules/recommendation/routes/recommendation.routes");
const returnRoutes = require("../modules/returns/routes/return.routes");
const fraudRoutes = require("../modules/fraud/routes/fraud.routes");
const dynamicPricingRoutes = require("../modules/pricing/routes/dynamic-pricing.routes");
const commissionRoutes = require("../modules/seller/routes/commission.routes");
const notificationPreferenceRoutes = require("../modules/notification/routes/notification-preference.routes");

function registerRoutes(app) {
  app.use(`${env.apiPrefix}/auth`, authRoutes);
  app.use(`${env.apiPrefix}/users`, userRoutes);
  app.use(`${env.apiPrefix}/products`, productRoutes);
  app.use(`${env.apiPrefix}/carts`, cartRoutes);
  app.use(`${env.apiPrefix}/orders`, orderRoutes);
  app.use(`${env.apiPrefix}/payments`, paymentRoutes);
  app.use(`${env.apiPrefix}/sellers`, sellerRoutes);
  app.use(`${env.apiPrefix}/notifications`, notificationRoutes);
  app.use(`${env.apiPrefix}/analytics`, analyticsRoutes);
  app.use(`${env.apiPrefix}/pricing`, pricingRoutes);
  app.use(`${env.apiPrefix}/wallets`, walletRoutes);
  
  // Production features - Phase 5
  app.use(`${env.apiPrefix}/loyalty`, loyaltyRoutes);
  app.use(`${env.apiPrefix}/recommendations`, recommendationRoutes);
  app.use(`${env.apiPrefix}/returns`, returnRoutes);
  app.use(`${env.apiPrefix}/fraud`, fraudRoutes);
  app.use(`${env.apiPrefix}/dynamic-pricing`, dynamicPricingRoutes);
  app.use(`${env.apiPrefix}/sellers/commissions`, commissionRoutes);
  app.use(`${env.apiPrefix}/notifications/preferences`, notificationPreferenceRoutes);
}

module.exports = { registerRoutes };
