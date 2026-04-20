const { env } = require("../../config/env");
const { logger } = require("../../shared/logger/logger");

let Sequelize;

try {
  ({ Sequelize } = require("sequelize"));
} catch (error) {
  Sequelize = null;
}

if (!Sequelize) {
  throw new Error(
    "Sequelize dependency is missing. Install it with: npm install sequelize sequelize-cli pg-hstore",
  );
}

const sequelize = new Sequelize(env.postgresUrl, {
  dialect: "postgres",
  logging: env.sequelize.logging ? (sql) => logger.info({ sql }, "sequelize-sql") : false,
  define: {
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    max: 15,
    min: 2,
    idle: 10000,
    acquire: 30000,
  },
});

async function connectSequelize() {
  await sequelize.authenticate();
  logger.info("Sequelize PostgreSQL connected");
}

module.exports = { sequelize, connectSequelize, Sequelize };

