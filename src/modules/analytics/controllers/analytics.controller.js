const { successResponse } = require("../../../shared/http/response");
const { AnalyticsService } = require("../services/analytics.service");

class AnalyticsController {
  constructor({ analyticsService = new AnalyticsService() } = {}) {
    this.analyticsService = analyticsService;
  }

  track = async (req, res) => {
    const event = await this.analyticsService.track(req.body);
    res.status(201).json(successResponse(event));
  };

  list = async (req, res) => {
    const events = await this.analyticsService.listEvents();
    res.json(successResponse(events));
  };
}

module.exports = { AnalyticsController };
