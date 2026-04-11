import * as amqplib from 'amqplib';
import prisma from '../../lib/prisma.js';
import { processContent } from '../../processors/content.processor.js';
import config from '../../config/index.js';

const QUEUE_NAME = config.rabbitmq_queue;

export async function startContentJobConsumer() {
  const connection = await amqplib.connect(config.rabbitmq_url!);
  const channel = await connection.createChannel();
  
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  console.log(`Worker listening on queue: ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());
    console.log(`Received job: ${job.jobId}`);

    try {
      // Update status to PROCESSING
      await prisma.content.update({
        where: { id: job.jobId },
        data: { status: 'PROCESSING' }
      });

      // Execute processing logic
      const result = await processContent(job.filePath, job.type);

      // Update DB with success
      await prisma.content.update({
        where: { id: job.jobId },
        data: { 
          status: 'COMPLETED',
          result: result,
          updatedAt: new Date()
        }
      });

      channel.ack(msg);
      console.log(`Job ${job.jobId} completed`);

    } catch (error) {
      console.error(`Job ${job.jobId} failed:`, error);
      
      // Update DB with error
      await prisma.content.update({
        where: { id: job.jobId },
        data: { 
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date()
        }
      });

      channel.ack(msg); // Ack to prevent infinite retry (implement retry logic later if needed)
    }
  });
}