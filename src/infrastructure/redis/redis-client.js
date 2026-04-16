const IORedis = require("ioredis");
const { env } = require("../../config/env");
const { logger } = require("../../shared/logger/logger");

const redis = new IORedis(env.redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (error) => logger.error({ err: error }, "Redis connection error"));

module.exports = { redis };
