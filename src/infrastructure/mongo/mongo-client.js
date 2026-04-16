const mongoose = require("mongoose");
const { env } = require("../../config/env");
const { logger } = require("../../shared/logger/logger");

async function connectMongo() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  logger.info("MongoDB connected");
}

module.exports = { mongoose, connectMongo };
