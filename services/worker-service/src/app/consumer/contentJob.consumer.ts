import * as amqplib from 'amqplib';
import prisma from '../../lib/prisma.js';
import { processContent } from '../../processors/content.processor.js';
import config from '../../config/index.js';

const QUEUE_NAME = config.rabbitmq_queue;
const EXCHANGE_NAME = config.rabbitmq_exchange;

export async function startContentJobConsumer() {
  const connection = await amqplib.connect(config.rabbitmq_url!);
  const channel = await connection.createChannel();
  
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
  
  console.log(`Worker listening on queue: ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const job = JSON.parse(msg.content.toString());
    console.log(`Received job: ${job.jobId}`);

    const publishStatus = (status: string, result?: string, error?: string) => {
      const event = { jobId: job.jobId, userId: job.userId, status, result, error, timestamp: new Date() };
      channel.publish(EXCHANGE_NAME, '', Buffer.from(JSON.stringify(event)));
    };

    try {
      // Update status to PROCESSING
      await prisma.content.update({
        where: { id: job.jobId },
        data: { status: 'PROCESSING' }
      });
      publishStatus('PROCESSING');

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
      publishStatus('COMPLETED', result);

      channel.ack(msg);
      console.log(`Job ${job.jobId} completed`);

    } catch (error) {
      console.error(`Job ${job.jobId} failed:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update DB with error
      await prisma.content.update({
        where: { id: job.jobId },
        data: { 
          status: 'FAILED',
          error: errorMessage,
          updatedAt: new Date()
        }
      });
      publishStatus('FAILED', undefined, errorMessage);

      channel.ack(msg);
    }
  });
}