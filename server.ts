/**
 * Pattern HMS - Enterprise Super Admin Server Entry Point
 * Full-stack Express API + Vite SPA integration on port 3000
 */
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Route handlers
import authRoutes from './server/routes/auth.routes.js';
import organizationRoutes from './server/routes/organizations.routes.js';
import userRoutes from './server/routes/users.routes.js';
import clinicalRoutes from './server/routes/clinical.routes.js';
import diagnosticsRoutes from './server/routes/diagnostics.routes.js';
import queueRoutes from './server/routes/queue.routes.js';
import bedsRoutes from './server/routes/beds.routes.js';
import billingRoutes from './server/routes/billing.routes.js';
import reportsRoutes from './server/routes/reports.routes.js';
import auditRoutes from './server/routes/audit.routes.js';
import settingsRoutes from './server/routes/settings.routes.js';
import receptionistRoutes from './server/routes/receptionist.routes.js';
import realtimeRoutes from './server/routes/realtime.routes.js';
import doctorRoutes from './server/routes/doctor.routes.js';
import labRoutes from './server/routes/lab.routes.js';
import displayRoutes from './server/routes/display.routes.js';
import financeRoutes from './server/routes/finance.routes.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security & body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/clinical', clinicalRoutes);
  app.use('/api/diagnostics', diagnosticsRoutes);
  app.use('/api/queue', queueRoutes);
  app.use('/api/beds', bedsRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/reception', receptionistRoutes);
  app.use('/api/receptionist', receptionistRoutes);
  app.use('/api/realtime', realtimeRoutes);
  app.use('/api/doctor', doctorRoutes);
  app.use('/api/lab', labRoutes);
  app.use('/api/display', displayRoutes);
  app.use('/api/finance', financeRoutes);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Pattern HMS Super Admin API', timestamp: new Date().toISOString() });
  });

  // Return JSON 404 for unhandled /api/* requests so Vite SPA never returns HTML for API endpoints
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: `API endpoint not found: ${req.method} ${req.path}` });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Pattern HMS] Super Admin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[Pattern HMS] Fatal server startup failure:', err);
  process.exit(1);
});
