const { Pool } = require("pg");
const { env } = require("../../config/env");
const { logger } = require("../../shared/logger/logger");

const postgresPool = new Pool({
  connectionString: env.postgresUrl,
});

async function connectPostgres() {
  await postgresPool.query("SELECT 1");
  logger.info("PostgreSQL connected");
}

module.exports = { postgresPool, connectPostgres };
