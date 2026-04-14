import * as amqplib from 'amqplib';
import prisma from '../../lib/prisma.js';
import { processContent } from '../../processors/content.processor.js';
import config from '../../config/index.js';

const QUEUE_NAME         = config.rabbitmq_queue;
const EXCHANGE_NAME      = config.rabbitmq_exchange;
const RETRY_QUEUE        = config.rabbitmq_retry_queue;
const RETRY_EXCHANGE     = config.rabbitmq_retry_exchange;
const DLQ_QUEUE          = config.rabbitmq_dlq_queue;
const MAX_RETRIES        = config.max_retries;
const RETRY_DELAY_MS     = config.retry_delay_ms;

// ─── Queue / Exchange Topology ────────────────────────────────────────────────
//
//  [content-processing]  --nack-->  [content-processing.retry]  --TTL-->  loop back
//                                                                (max retries) ↓
//                                                         [content-processing.dlq]
//
async function setupTopology(channel: amqplib.Channel) {
  // 1. Retry exchange (direct, receives nack'd messages from main queue)
  await channel.assertExchange(RETRY_EXCHANGE, 'direct', { durable: true });

  // 2. DLQ — terminal, no dead-letter routing
  await channel.assertQueue(DLQ_QUEUE, { durable: true });

  // 3. Retry queue — messages sit here for RETRY_DELAY_MS, then re-routed to main queue
  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      'x-message-ttl':             RETRY_DELAY_MS,      // delay before re-queue
      'x-dead-letter-exchange':    '',                   // default exchange
      'x-dead-letter-routing-key': QUEUE_NAME,          // back to main queue
    },
  });
  await channel.bindQueue(RETRY_QUEUE, RETRY_EXCHANGE, RETRY_QUEUE);

  // 4. Main queue — nack routes to retry exchange
  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange':    RETRY_EXCHANGE,
      'x-dead-letter-routing-key': RETRY_QUEUE,
    },
  });

  // 5. Job-status fanout exchange (for notifications)
  await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRetryCount(msg: amqplib.Message): number {
  return (msg.properties.headers?.['x-retry-count'] as number) || 0;
}

function publishStatus(
  channel: amqplib.Channel,
  jobId: string,
  userId: string,
  status: string,
  result?: string,
  error?: string,
) {
  const event = { jobId, userId, status, result, error, timestamp: new Date() };
  channel.publish(EXCHANGE_NAME, '', Buffer.from(JSON.stringify(event)));
}

function sendToRetry(channel: amqplib.Channel, msg: amqplib.Message, retryCount: number) {
  channel.publish(
    RETRY_EXCHANGE,
    RETRY_QUEUE,
    msg.content,
    {
      persistent: true,
      headers: { ...msg.properties.headers, 'x-retry-count': retryCount + 1 },
    },
  );
  // Ack original so RabbitMQ doesn't re-deliver it directly
  channel.ack(msg);
  console.log(`[RETRY] Job re-queued (attempt ${retryCount + 1}/${MAX_RETRIES})`);
}

function sendToDLQ(channel: amqplib.Channel, msg: amqplib.Message, retryCount: number) {
  channel.sendToQueue(
    DLQ_QUEUE,
    msg.content,
    {
      persistent: true,
      headers: { ...msg.properties.headers, 'x-retry-count': retryCount, 'x-failed-at': new Date().toISOString() },
    },
  );
  channel.ack(msg);
  console.error(`[DLQ] Job sent to dead letter queue after ${retryCount} retries`);
}

// ─── Main Consumer ────────────────────────────────────────────────────────────

export async function startContentJobConsumer(): Promise<amqplib.Channel> {
  const connection = await amqplib.connect(config.rabbitmq_url!);
  const channel    = await connection.createChannel();
  channel.prefetch(1);

  await setupTopology(channel);

  console.log(`Worker listening on queue: ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    let job: any;
    try {
      job = JSON.parse(msg.content.toString());
    } catch {
      // Malformed JSON — send straight to DLQ, no retries
      sendToDLQ(channel, msg, 0);
      return;
    }

    const retryCount = getRetryCount(msg);
    console.log(`Received job: ${job.jobId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);

    try {
      // Mark as PROCESSING (only on first attempt)
      if (retryCount === 0) {
        await prisma.content.update({
          where: { id: job.jobId },
          data:  { status: 'PROCESSING' },
        });
        publishStatus(channel, job.jobId, job.userId, 'PROCESSING');
      }

      const result = await processContent(job.filePath, job.type);

      await prisma.content.update({
        where: { id: job.jobId },
        data:  { status: 'COMPLETED', result, updatedAt: new Date() },
      });
      publishStatus(channel, job.jobId, job.userId, 'COMPLETED', result);

      channel.ack(msg);
      console.log(`Job ${job.jobId} completed successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Job ${job.jobId} failed (attempt ${retryCount + 1}): ${errorMessage}`);

      if (retryCount < MAX_RETRIES) {
        // Still have retries — route to retry queue
        sendToRetry(channel, msg, retryCount);
      } else {
        // Exhausted all retries — send to DLQ and update DB
        await prisma.content.update({
          where: { id: job.jobId },
          data:  { status: 'FAILED', error: errorMessage, updatedAt: new Date() },
        }).catch(() => {}); // best-effort

        publishStatus(channel, job.jobId, job.userId, 'FAILED', undefined, errorMessage);
        sendToDLQ(channel, msg, retryCount);
      }
    }
  });

  return channel;
}