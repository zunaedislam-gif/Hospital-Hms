/**
 * Pattern HMS - Real-time SSE Stream Endpoint
 */
import { Router, Request, Response } from 'express';
import { realtimeHub } from '../realtime.js';

const router = Router();

router.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if any

  res.flushHeaders?.();

  const clientId = 'client_' + Math.random().toString(36).substr(2, 9);
  const branchId = req.query.branchId as string | undefined;
  const orgId = req.query.orgId as string | undefined;

  realtimeHub.addClient(clientId, res, branchId, orgId);

  // Send initial handshake
  res.write(`event: CONNECTED\n`);
  res.write(`data: ${JSON.stringify({ status: 'CONNECTED', clientId, timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    realtimeHub.removeClient(clientId);
  });
});

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    connectedClients: realtimeHub.getConnectedClientsCount(),
    timestamp: new Date().toISOString()
  });
});

export default router;
