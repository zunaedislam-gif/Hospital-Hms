/**
 * Pattern HMS - Audit Trails & Security Telemetry Routes
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/audit/logs
router.get('/logs', authenticate, requirePermission('audit.view'), (req: AuthRequest, res: Response) => {
  const { actor, action, entity, search, limit = '50' } = req.query as any;

  let logs = [...db.raw.auditLogs];

  if (actor) {
    logs = logs.filter(l => l.actorEmail.toLowerCase().includes(actor.toLowerCase()));
  }
  if (action) {
    logs = logs.filter(l => l.action.toLowerCase() === action.toLowerCase());
  }
  if (entity) {
    logs = logs.filter(l => l.entity.toLowerCase() === entity.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter(l => 
      l.action.toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q) ||
      l.actorEmail.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q)
    );
  }

  const limitNum = parseInt(limit, 10) || 50;
  res.json({
    success: true,
    data: logs.slice(0, limitNum),
    total: logs.length
  });
});

// GET /api/audit/activity
router.get('/activity', authenticate, (req: AuthRequest, res: Response) => {
  const { category, limit = '30' } = req.query as any;
  let items = [...db.raw.activityLogs];

  if (category) {
    items = items.filter(a => a.category === category);
  }

  const limitNum = parseInt(limit, 10) || 30;
  res.json({
    success: true,
    data: items.slice(0, limitNum)
  });
});

// GET /api/audit/security-overview
router.get('/security-overview', authenticate, requirePermission('audit.view'), (req: AuthRequest, res: Response) => {
  const lockedUsers = db.raw.users.filter(u => u.status === 'LOCKED');
  const suspendedUsers = db.raw.users.filter(u => u.status === 'SUSPENDED');
  const recentAudits = db.raw.auditLogs.slice(0, 10);

  res.json({
    success: true,
    data: {
      lockedUsersCount: lockedUsers.length,
      lockedUsers: lockedUsers.map(u => ({ id: u.id, email: u.email, fullName: u.fullName })),
      suspendedUsersCount: suspendedUsers.length,
      activeSessionsCount: 6,
      securityPoliciesEnforced: {
        twoFactorAuthentication: 'Supported',
        bruteForceProtection: 'Active (5 Attempts Max)',
        sessionInactivityTimeout: '120 Minutes',
        auditRetention: 'Indefinite'
      },
      recentAudits
    }
  });
});

export default router;
