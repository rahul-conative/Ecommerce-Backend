const { Queue, Worker } = require("bullmq");
const { redis } = require("../../infrastructure/redis/redis-client");

function createQueue(name) {
  return new Queue(name, {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      removeOnComplete: 1000,
      removeOnFail: 1000,
    },
  });
}

function createWorker(name, processor) {
  return new Worker(name, processor, {
    connection: redis,
  });
}

module.exports = { createQueue, createWorker };
