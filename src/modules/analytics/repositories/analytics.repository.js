const { AnalyticsModel } = require("../models/analytics.model");

class AnalyticsRepository {
  async create(payload) {
    return AnalyticsModel.create(payload);
  }

  async list(limit = 20) {
    return AnalyticsModel.find({}).sort({ createdAt: -1 }).limit(limit);
  }
}

module.exports = { AnalyticsRepository };
