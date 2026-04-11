import { Server } from "http";
import app from "./app.js";
import config from "./config/index.js";
import { connectRabbitMQ } from "./lib/rabbitmq.js";

async function bootstrap() {
  const server: Server = app.listen(config.port, () => {
    console.log(`Content service running on port ${config.port}`);
  });

  // Connect to RabbitMQ
  try {
    await connectRabbitMQ(config.rabbitmq_url!, config.rabbitmq_queue!);
    console.log("Connected to RabbitMQ");
  } catch (error) {
    console.error("Failed to connect to RabbitMQ:", error);
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
