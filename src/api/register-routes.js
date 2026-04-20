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
const { adminRoutes } = require("../modules/admin/routes/admin.routes");
const { taxRoutes } = require("../modules/tax/routes/tax.routes");

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
  app.use(`${env.apiPrefix}/admin`, adminRoutes);
  app.use(`${env.apiPrefix}/tax`, taxRoutes);
}

module.exports = { registerRoutes };
