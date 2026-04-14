import { Server } from "http";
import app from "./app.js";
import config from "./config/index.js";
import { startJobStatusConsumer } from "./consumers/jobCompleted.consumer.js";

async function bootstrap() {
  const server: Server = app.listen(config.port, () => {
    console.log(`Notification service running on port ${config.port}`);
  });

  // Start RabbitMQ consumer
  try {
    await startJobStatusConsumer();
  } catch (error) {
    console.error("Failed to start job status consumer:", error);
  }

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Notification service closed");
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
