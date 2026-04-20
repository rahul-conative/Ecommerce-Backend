#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { sequelize, Sequelize } = require("../../src/infrastructure/sequelize/sequelize-client");

async function ensureMigrationTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS _app_migrations (
      id VARCHAR(128) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrationIds() {
  const [rows] = await sequelize.query("SELECT id FROM _app_migrations");
  return new Set(rows.map((row) => row.id));
}

function loadMigrationFiles() {
  const dir = path.resolve(__dirname, "../../sequelize/migrations");
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".js"))
    .sort((a, b) => a.localeCompare(b))
    .map((fileName) => {
      const migration = require(path.join(dir, fileName));
      if (!migration.id || typeof migration.up !== "function") {
        throw new Error(`Invalid migration file: ${fileName}`);
      }
      return migration;
    });
}

async function applyMigration(migration) {
  const queryInterface = sequelize.getQueryInterface();
  const transaction = await sequelize.transaction();

  try {
    await migration.up({ queryInterface, Sequelize, transaction });
    await sequelize.query("INSERT INTO _app_migrations (id) VALUES ($1)", {
      bind: [migration.id],
      transaction,
    });
    await transaction.commit();
    process.stdout.write(`Applied migration: ${migration.id}\n`);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function main() {
  await sequelize.authenticate();
  await ensureMigrationTable();
  const applied = await getAppliedMigrationIds();
  const migrations = loadMigrationFiles();

  for (const migration of migrations) {
    if (!applied.has(migration.id)) {
      await applyMigration(migration);
    }
  }

  process.stdout.write("Sequelize migrations completed\n");
}

main()
  .catch((error) => {
    process.stderr.write(`Migration failed: ${error.stack || error.message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });

