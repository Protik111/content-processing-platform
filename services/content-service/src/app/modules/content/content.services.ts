import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { publishToQueue } from "../../../shared/rabbitmq.js"; // helper for RabbitMQ
import { ICreateContentJob } from "./content.interfaces.js";

const prisma = new PrismaClient();

// Create a new content job
const createContentJob = async (data: ICreateContentJob): Promise<string> => {
  // Generate a jobId
  const jobId = uuidv4();

  // Save record in PostgreSQL
  await prisma.content.create({
    data: {
      id: jobId,
      userId: data.userId,
      filePath: data.filePath,
      type: data.type,
      status: "PENDING",
    },
  });

  // Publish message to RabbitMQ (direct exchange)
  await publishToQueue("content.processing", {
    jobId,
    filePath: data.filePath,
    type: data.type,
    userId: data.userId,
  });

  // Return jobId to controller
  return jobId;
};

export const ContentService = {
  createContentJob,
};
