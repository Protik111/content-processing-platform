import { v4 as uuidv4 } from "uuid";
import { ICreateContentJob } from "./content.interfaces.js";
import prisma from "../../../shared/prisma.js";
import { publishToQueue } from "../../../lib/rabbitmq.js";


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
  await publishToQueue("content-processing", {
    jobId,
    filePath: data.filePath,
    type: data.type,
    userId: data.userId,
  });

  // Return jobId to controller
  return jobId;
};

// Get content job details
const getContentJob = async (jobId: string) => {
  const result = await prisma.content.findUnique({
    where: {
      id: jobId,
    },
  });

  return result;
};

export const ContentService = {
  createContentJob,
  getContentJob,
};
