const { logger } = require("../shared/logger/logger");
const { createWorker } = require("../shared/queues/queue-factory");
const { sendMail } = require("../infrastructure/mail/mailer");

let registered = false;
let workers = [];

function registerWorkers() {
  if (registered) {
    return;
  }

  registered = true;
  workers = [
    createWorker("notifications", async (job) => {
      if (job.name === "welcome-email") {
        await sendMail({
          to: job.data.email,
          subject: "Welcome to scalable-ecommerce",
          html: "<p>Your account is ready. Start shopping or selling.</p>",
        });
      }
    }),
  ];
  logger.info("BullMQ workers registered");
}

module.exports = { registerWorkers, workers };
