const pino = require("pino");
const { env } = require("../../config/env");

const logger = pino({
  name: env.appName,
  level: env.nodeEnv === "production" ? "info" : "debug",
});

module.exports = { logger };
