import { Server } from "http";
import app from "./app.js";
import config from "./config/index.js";
import { startContentJobConsumer } from "./app/consumer/contentJob.consumer.js";

async function bootstrap() {
  const server: Server = app.listen(config.port, () => {
    console.log(`Worker service running on port ${config.port}`);
  });

  // Start RabbitMQ consumer
  try {
    await startContentJobConsumer();
  } catch (error) {
    console.error("Failed to start content job consumer:", error);
  }

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Content service closed");
      });
    }
    process.exit(1);
  };

  const unexpectedErrorHandler = (error: unknown) => {
    console.log(error);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);

  process.on("SIGTERM", () => {
    console.log("SIGTERM received");
    if (server) {
      server.close();
    }
  });
}

bootstrap();
