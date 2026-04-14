import * as amqplib from 'amqplib';
import prisma from '../../lib/prisma.js';
import config from '../../config/index.js';

const DLQ_QUEUE     = config.rabbitmq_dlq_queue;
const EXCHANGE_NAME = config.rabbitmq_exchange;

export async function startDLQConsumer(channel: amqplib.Channel) {
  // DLQ queue must already exist (set up by the main consumer's topology)
  await channel.assertQueue(DLQ_QUEUE, { durable: true });

  console.log(`DLQ consumer listening on: ${DLQ_QUEUE}`);

  channel.consume(DLQ_QUEUE, async (msg) => {
    if (!msg) return;

    let job: any;
    try {
      job = JSON.parse(msg.content.toString());
    } catch {
      console.error('[DLQ] Received unparse-able message, discarding.');
      channel.ack(msg);
      return;
    }

    const retryCount  = (msg.properties.headers?.['x-retry-count'] as number) || 0;
    const failedAt    = msg.properties.headers?.['x-failed-at'] || new Date().toISOString();

    console.error(
      `[DLQ] Dead message received:\n` +
      `  jobId      : ${job.jobId}\n` +
      `  userId     : ${job.userId}\n` +
      `  type       : ${job.type}\n` +
      `  retryCount : ${retryCount}\n` +
      `  failedAt   : ${failedAt}`,
    );

    // Ensure DB reflects final FAILED state (best-effort)
    try {
      await prisma.content.update({
        where: { id: job.jobId },
        data:  { status: 'FAILED', error: `Failed after ${retryCount} retries`, updatedAt: new Date() },
      });
    } catch (dbError) {
      console.error('[DLQ] Could not update DB record:', dbError);
    }

    // Notify connected SSE clients of final failure
    try {
      const event = {
        jobId:   job.jobId,
        userId:  job.userId,
        status:  'FAILED',
        error:   `Job permanently failed after ${retryCount} retries`,
        timestamp: new Date(),
      };
      channel.publish(EXCHANGE_NAME, '', Buffer.from(JSON.stringify(event)));
    } catch (pubError) {
      console.error('[DLQ] Could not publish FAILED status event:', pubError);
    }

    channel.ack(msg);
  });
}
