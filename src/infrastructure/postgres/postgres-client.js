const { Pool } = require("pg");
const { env } = require("../../config/env");
const { logger } = require("../../shared/logger/logger");
const { knex } = require("./knex-client");

const postgresPool = new Pool({
  connectionString: env.postgresUrl,
});

async function connectPostgres() {
  await Promise.all([postgresPool.query("SELECT 1"), knex.raw("SELECT 1")]);
  logger.info("PostgreSQL connected");
}

module.exports = { postgresPool, connectPostgres, knex };
