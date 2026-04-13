import * as amqplib from 'amqplib';
import { sseManager } from '../sse/sse.manager.js';
import config from '../config/index.js';

const EXCHANGE_NAME = config.rabbitmq_exchange;
const QUEUE_NAME = `notifications_${process.env.HOSTNAME || 'default'}_${Date.now()}`;

export async function startJobStatusConsumer() {
  const connection = await amqplib.connect(config.rabbitmq_url!);
  const channel = await connection.createChannel();

  // Declare fanout exchange
  await channel.assertExchange(EXCHANGE_NAME, 'fanout', { durable: true });

  // Create unique temporary queue for this instance
  const { queue } = await channel.assertQueue(QUEUE_NAME, { 
    exclusive: true, 
    autoDelete: true 
  });
  
  // Bind queue to fanout exchange
  await channel.bindQueue(queue, EXCHANGE_NAME, '');

  console.log(`Notification service subscribed to fanout exchange: ${EXCHANGE_NAME}`);

  channel.consume(queue, async (msg) => {
    if (!msg) return;

    try {
      const event = JSON.parse(msg.content.toString());
      console.log(`Received job status: ${event.jobId} -> ${event.status}`);

      // Broadcast to all connected SSE clients
      sseManager.broadcast('jobUpdate', event);

      channel.ack(msg);
    } catch (error) {
      console.error('Failed to process notification event:', error);
      channel.nack(msg, false, false); // Drop malformed messages
    }
  });
}