const { logger } = require("../../shared/logger/logger");
const { incrementCounter } = require("../cache/redis-client");

/**
 * Observability & Metrics Tracking
 * For 200k+ users, track:
 * - API response times
 * - Error rates
 * - Business metrics (orders/min, revenue/min)
 * - Resource usage
 */

const metrics = {
  // Counters
  requests: 0,
  errors: 0,
  orders: 0,
  payments: 0,
  users: 0,

  // Histograms (response times)
  responseTimes: [],
};

async function trackMetric(metricName, value = 1) {
  try {
    await incrementCounter(`metric:${metricName}`, value);
  } catch (error) {
    logger.warn({ err: error, metricName }, "Metric tracking error");
  }
}

async function trackLatency(endpoint, latencyMs) {
  const bucketKey = `latency:${endpoint}`;
  try {
    await incrementCounter(`${bucketKey}:total`, latencyMs);
    await incrementCounter(`${bucketKey}:count`, 1);
  } catch (error) {
    logger.warn({ err: error, endpoint }, "Latency tracking error");
  }
}

function createMetricsMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on("finish", async () => {
      const latency = Date.now() - startTime;
      const endpoint = `${req.method}:${req.route?.path || req.path}`;

      await trackLatency(endpoint, latency);
      await trackMetric("requests");

      if (res.statusCode >= 400) {
        await trackMetric("errors");
      }

      logger.debug({ endpoint, statusCode: res.statusCode, latency }, "Request completed");
    });

    next();
  };
}

module.exports = {
  metrics,
  trackMetric,
  trackLatency,
  createMetricsMiddleware,
};
