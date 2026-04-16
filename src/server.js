const { createApp } = require("./app/create-app");
const { env } = require("./config/env");
const { logger } = require("./shared/logger/logger");
const http = require("http");
const { attachSocketServer } = require("./infrastructure/realtime/socket-server");

async function bootstrap() {
  const app = await createApp();
  const httpServer = http.createServer(app);
  attachSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    logger.info({ port: env.port }, "HTTP server started");
  });
}

bootstrap().catch((error) => {
  logger.error({ err: error }, "Bootstrap failed");
  process.exit(1);
});
