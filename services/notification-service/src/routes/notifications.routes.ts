import { Router, Request, Response } from 'express';
import { sseManager } from '../sse/sse.manager.js';

const router = Router();

// SSE endpoint for clients to subscribe
router.get('/stream', (req: Request, res: Response) => {
  const clientId = req.headers['x-client-id'] as string || `client_${Date.now()}`;
  sseManager.addClient(clientId, res);

  // Cleanup on disconnect
  req.on('close', () => {
    sseManager.removeClient(clientId);
  });
});

export const NotificationRoutes = router;