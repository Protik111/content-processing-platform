import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT || 5001,
  rabbitmq_url: process.env.RABBITMQ_URL || "amqp://guest:guest@rabbitmq:5672",
  rabbitmq_queue: process.env.RABBITMQ_QUEUE || "content-processing",
  rabbitmq_exchange: process.env.RABBITMQ_EXCHANGE || "job.status",
  rabbitmq_retry_queue: process.env.RABBITMQ_RETRY_QUEUE || "content-processing.retry",
  rabbitmq_retry_exchange: process.env.RABBITMQ_RETRY_EXCHANGE || "content-processing.retry",
  rabbitmq_dlq_queue: process.env.RABBITMQ_DLQ_QUEUE || "content-processing.dlq",
  max_retries: parseInt(process.env.MAX_RETRIES || "3", 10),
  retry_delay_ms: parseInt(process.env.RABBITMQ_RETRY_DELAY_MS || "30000", 10),
  database_url: process.env.DATABASE_URL,
};
