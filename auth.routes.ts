/**
 * Pattern HMS - Authentication Routes
 */
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/store.js';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and Password are required.'
      });
    }

    const cleanInput = String(username).trim();
    // Support login by email OR username
    const user = cleanInput.includes('@')
      ? db.getUserByEmail(cleanInput)
      : db.getUserByUsername(cleanInput);

    if (!user) {
      // General error to prevent account enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials provided.'
      });
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Account is suspended. Please contact platform administration.'
      });
    }

    if (user.status === 'LOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Account is locked due to security policy. Please contact an administrator.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.status = 'LOCKED';
        db.logAudit(
          { id: user.id, email: user.email, role: user.roleCode },
          'ACCOUNT_LOCKED_BRUTE_FORCE',
          'User',
          user.id,
          { status: 'ACTIVE' },
          { status: 'LOCKED', reason: '5 failed login attempts' }
        );
      }
      db.persist();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials provided.'
      });
    }

    // Reset failed login counter on success
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date().toISOString();
    db.persist();

    const token = generateToken(user);
    const role = db.raw.roles.find(r => r.code === user.roleCode);

    db.logAudit(
      { id: user.id, email: user.email, role: user.roleCode },
      'USER_LOGIN',
      'User',
      user.id,
      null,
      { lastLogin: user.lastLogin },
      req.ip || '127.0.0.1',
      req.headers['user-agent'] || 'Web'
    );

    const { passwordHash: _, ...userSafe } = user;

    return res.json({
      success: true,
      message: 'Authentication successful',
      data: {
        token,
        user: userSafe,
        role,
        permissions: role ? role.permissions : []
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: 'Authentication process failed: ' + err.message
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not logged in' });
  }
  const { passwordHash: _, ...userSafe } = req.user;
  res.json({
    success: true,
    data: {
      user: userSafe,
      role: req.userRole,
      permissions: req.userPermissions
    }
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticate, (req: AuthRequest, res: Response): any => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters long.' });
    }

    const user = req.user!;
    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    db.persist();

    db.logAudit(
      { id: user.id, email: user.email, role: user.roleCode },
      'CHANGE_PASSWORD',
      'User',
      user.id,
      null,
      { updated: true }
    );

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req: AuthRequest, res: Response) => {
  if (req.user) {
    db.logAudit(
      { id: req.user.id, email: req.user.email, role: req.user.roleCode },
      'USER_LOGOUT',
      'User',
      req.user.id,
      null,
      null
    );
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/sessions
router.get('/sessions', authenticate, (req: AuthRequest, res: Response) => {
  const sessions = [
    {
      id: 'sess_curr',
      userId: req.user!.id,
      userEmail: req.user!.email,
      userRole: req.user!.roleCode,
      ipAddress: req.ip || '192.168.1.10',
      userAgent: req.headers['user-agent'] || 'Chrome / macOS',
      deviceType: 'Desktop Workstation',
      isCurrent: true,
      lastActive: new Date().toISOString(),
      createdAt: req.user!.lastLogin || new Date().toISOString()
    }
  ];
  res.json({ success: true, data: sessions });
});

export default router;
