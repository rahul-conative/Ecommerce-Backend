/**
 * Reporting & Analytics Service (PRODUCTION READY)
 */

const { knex } = require("../../infrastructure/postgres/postgres-client");
const { AnalyticsModel } = require("../../modules/analytics/models/analytics.model");
const { logger } = require("../logger/logger");

class ReportingService {
  // ==============================
  // Dashboard
  // ==============================
  async getDashboardMetrics(startDate, endDate) {
    try {
      const [orders, payments, users] = await Promise.all([
        this.getOrderMetrics(startDate, endDate),
        this.getPaymentMetrics(startDate, endDate),
        this.getUserMetrics(startDate, endDate),
      ]);

      return {
        orders,
        payments,
        users,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error({ err: error }, "Dashboard metrics failed");
      throw new Error("Analytics unavailable");
    }
  }

  // ==============================
  // Orders
  // ==============================
  async getOrderMetrics(startDate, endDate) {
    try {
      return await knex("orders")
        .whereBetween("created_at", [startDate, endDate])
        .select(
          knex.raw("COUNT(*) as total_orders"),
          knex.raw("COALESCE(AVG(total_amount),0) as avg_order_value"),
          knex.raw("COALESCE(SUM(total_amount),0) as total_revenue"),
          "status"
        )
        .groupBy("status");
    } catch (error) {
      logger.error({ err: error }, "Order metrics failed");
      return [];
    }
  }

  // ==============================
  // Payments
  // ==============================
  async getPaymentMetrics(startDate, endDate) {
    try {
      return await knex("payments")
        .whereBetween("created_at", [startDate, endDate])
        .select(
          knex.raw("COUNT(*) as total_payments"),
          knex.raw("COALESCE(SUM(amount),0) as total_amount"),
          knex.raw(
            "COUNT(CASE WHEN status = 'verified' THEN 1 END) as successful"
          ),
          "provider"
        )
        .groupBy("provider");
    } catch (error) {
      logger.error({ err: error }, "Payment metrics failed");
      return [];
    }
  }

  // ==============================
  // Users
  // ==============================
  async getUserMetrics(startDate, endDate) {
    try {
      const [newUsers, activeUsers] = await Promise.all([
        AnalyticsModel.countDocuments({
          eventName: "user:registered",
          createdAt: { $gte: startDate, $lte: endDate },
        }),
        AnalyticsModel.distinct("actorId", {
          createdAt: { $gte: startDate, $lte: endDate },
        }),
      ]);

      return {
        new_users: newUsers,
        active_users: activeUsers.length,
      };
    } catch (error) {
      logger.error({ err: error }, "User metrics failed");
      return { new_users: 0, active_users: 0 };
    }
  }

  // ==============================
  // Product Performance
  // ==============================
  async getProductPerformance(days = 30, limit = 100) {
    try {
      const since = new Date(Date.now() - days * 86400000);

      return await AnalyticsModel.aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            "metadata.productId": { $exists: true },
          },
        },
        {
          $group: {
            _id: "$metadata.productId",
            views: {
              $sum: {
                $cond: [{ $eq: ["$eventName", "product:viewed"] }, 1, 0],
              },
            },
            cartAdds: {
              $sum: {
                $cond: [{ $eq: ["$eventName", "product:added_to_cart"] }, 1, 0],
              },
            },
            purchases: {
              $sum: {
                $cond: [{ $eq: ["$eventName", "product:purchased"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            productId: "$_id",
            views: 1,
            cartAdds: 1,
            purchases: 1,
            cartConversion: {
              $cond: [
                { $gt: ["$views", 0] },
                { $divide: ["$cartAdds", "$views"] },
                0,
              ],
            },
            purchaseConversion: {
              $cond: [
                { $gt: ["$cartAdds", 0] },
                { $divide: ["$purchases", "$cartAdds"] },
                0,
              ],
            },
          },
        },
        { $sort: { purchases: -1 } },
        { $limit: limit },
      ]);
    } catch (error) {
      logger.error({ err: error }, "Product analytics failed");
      return [];
    }
  }

  // ==============================
  // Seller Performance
  // ==============================
  async getSellerPerformance(days = 30) {
    try {
      const since = new Date(Date.now() - days * 86400000);

      return await knex("orders")
        .join("order_items", "orders.id", "=", "order_items.order_id") // ✅ FIXED
        .whereBetween("orders.created_at", [since, new Date()])
        .select(
          "order_items.seller_id",
          knex.raw("COUNT(DISTINCT orders.id) as order_count"),
          knex.raw("COALESCE(SUM(order_items.line_total),0) as total_revenue"),
          knex.raw("COALESCE(AVG(order_items.unit_price),0) as avg_price")
        )
        .groupBy("order_items.seller_id")
        .orderBy("total_revenue", "desc")
        .limit(100);
    } catch (error) {
      logger.error({ err: error }, "Seller performance failed");
      return [];
    }
  }

  // ==============================
  // Revenue Breakdown
  // ==============================
  async getRevenueBreakdown(startDate, endDate) {
    try {
      return await knex("payments")
        .whereBetween("created_at", [startDate, endDate])
        .where("status", "verified")
        .select(
          "provider",
          knex.raw("COUNT(*) as transactions"),
          knex.raw("SUM(amount) as revenue"),
          knex.raw("AVG(amount) as avg_transaction")
        )
        .groupBy("provider");
    } catch (error) {
      logger.error({ err: error }, "Revenue breakdown failed");
      return [];
    }
  }
}

module.exports = {
  ReportingService: new ReportingService(),
};