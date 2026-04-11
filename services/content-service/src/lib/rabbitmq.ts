import * as amqplib from 'amqplib';

let channel: amqplib.Channel | null = null;

export async function connectRabbitMQ(url: string, queueName: string) {
  const connection = await amqplib.connect(url);
  channel = await connection.createChannel();
  await channel.assertQueue(queueName, { durable: true });
  return channel;
}

export async function publishToQueue(queue: string, message: any) {
  if (!channel) throw new Error('RabbitMQ not connected');
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
}