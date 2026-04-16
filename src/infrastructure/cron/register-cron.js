const { env } = require("../../config/env");
const { logger } = require("../../shared/logger/logger");
const { outboxProcessor } = require("../events/outbox-processor");

function runPeriodicJob(name, callback, intervalMs) {
  setInterval(async () => {
    try {
      await callback();
      logger.info({ job: name }, "Cron job completed");
    } catch (error) {
      logger.error({ err: error, job: name }, "Cron job failed");
    }
  }, intervalMs);
}

function registerCronJobs() {
  if (!env.enableCron) {
    return;
  }

  runPeriodicJob("order-cleanup", async () => {}, 10 * 60 * 1000);
  runPeriodicJob("payment-retries", async () => {}, 5 * 60 * 1000);
  runPeriodicJob("analytics-aggregation", async () => {}, 30 * 60 * 1000);
  runPeriodicJob("outbox-flush", async () => outboxProcessor.flushPending(), 15 * 1000);
}

module.exports = { registerCronJobs };
