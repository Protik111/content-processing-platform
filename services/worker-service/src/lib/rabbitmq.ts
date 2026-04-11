import * as amqplib from 'amqplib';

let channel: amqplib.Channel | null = null;

export async function connectRabbitMQ(url: string): Promise<amqplib.Channel> {
  const connection = await amqplib.connect(url);
  channel = await connection.createChannel();
  
  // Ensure connection cleanup on process exit
  process.on('SIGINT', async () => {
    await channel?.close();
    await connection.close();
    process.exit(0);
  });
  
  return channel;
}

export function getChannel(): amqplib.Channel {
  if (!channel) throw new Error('RabbitMQ not connected');
  return channel;
}