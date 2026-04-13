import { Response } from 'express';

type ClientId = string;
type SSEClient = { id: ClientId; response: Response; heartbeat: NodeJS.Timeout };

class SSEManager {
  private clients = new Map<ClientId, SSEClient>();

  // Add new client
  addClient(id: ClientId, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', clientId: id })}\n\n`);

    // Heartbeat to keep connection alive (prevents proxy timeouts)
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 30000);

    this.clients.set(id, { id, response: res, heartbeat });
    console.log(` SSE client connected: ${id} (total: ${this.clients.size})`);
  }

  // Broadcast to all clients
  broadcast(event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    let disconnected = 0;

    this.clients.forEach((client) => {
      try {
        client.response.write(message);
      } catch {
        this.removeClient(client.id);
        disconnected++;
      }
    });

    if (disconnected > 0) {
      console.log(`Cleaned up ${disconnected} disconnected clients`);
    }
  }

  // Remove client
  removeClient(id: ClientId) {
    const client = this.clients.get(id);
    if (client) {
      clearInterval(client.heartbeat);
      client.response.end();
      this.clients.delete(id);
      console.log(`SSE client disconnected: ${id}`);
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();