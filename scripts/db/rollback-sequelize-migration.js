#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { sequelize, Sequelize } = require("../../src/infrastructure/sequelize/sequelize-client");

function loadMigrationById(id) {
  const dir = path.resolve(__dirname, "../../sequelize/migrations");
  const files = fs.readdirSync(dir).filter((name) => name.endsWith(".js"));
  for (const file of files) {
    const migration = require(path.join(dir, file));
    if (migration.id === id) {
      return migration;
    }
  }
  return null;
}

async function main() {
  await sequelize.authenticate();
  const [rows] = await sequelize.query(
    "SELECT id FROM _app_migrations ORDER BY applied_at DESC LIMIT 1",
  );
  const latest = rows[0];
  if (!latest) {
    process.stdout.write("No migrations to rollback\n");
    return;
  }

  const migration = loadMigrationById(latest.id);
  if (!migration || typeof migration.down !== "function") {
    throw new Error(`Cannot rollback migration ${latest.id}. down() not found.`);
  }

  const transaction = await sequelize.transaction();
  try {
    await migration.down({ queryInterface: sequelize.getQueryInterface(), Sequelize, transaction });
    await sequelize.query("DELETE FROM _app_migrations WHERE id = $1", {
      bind: [latest.id],
      transaction,
    });
    await transaction.commit();
    process.stdout.write(`Rolled back migration: ${latest.id}\n`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

main()
  .catch((error) => {
    process.stderr.write(`Rollback failed: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });

