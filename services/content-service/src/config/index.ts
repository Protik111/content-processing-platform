import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT || 5000,
  rabbitmq_url: process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672",
  rabbitmq_queue: process.env.RABBITMQ_QUEUE || "content-processing",
};
