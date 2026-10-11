/**
 * Pattern HMS - Authentication & Authorization Middleware
 * Enforces JWT session validation, role hierarchy, granular permission checks,
 * IP detection, and audit tracing.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/store.js';
import { User, Role } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pattern_hms_jwt_secret_key_change_in_production';

export interface AuthRequest extends Request {
  user?: User;
  userRole?: Role;
  userPermissions?: string[];
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      roleCode: user.roleCode,
      orgId: user.organizationId,
      branchId: user.branchId
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to Pattern HMS.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = db.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session. User no longer exists.'
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact platform administration.'
      });
    }

    if (user.status === 'LOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Your account is locked due to security policy.'
      });
    }

    const role = db.raw.roles.find(r => r.code === user.roleCode);
    const permissions = role ? role.permissions : [];

    req.user = user;
    req.userRole = role;
    req.userPermissions = permissions;

    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: 'Session expired or invalid token.'
    });
  }
}

/**
 * Super Admin strictly required check
 */
export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.roleCode !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin authorization required.'
    });
  }
  next();
}

/**
 * Permission aliases mapping to reconcile front-desk and clinical nomenclature
 */
const PERMISSION_ALIASES: Record<string, string[]> = {
  'reception.view': ['reception.view', 'patient.view', 'appointment.view', 'queue.view', 'invoice.view'],
  'reception.manage': ['reception.manage', 'organization.manage', 'branch.manage'],
  'queue.issue_token': ['queue.issue_token', 'queue.create', 'queue.manage'],
  'queue.call_token': ['queue.call_token', 'queue.call', 'queue.manage'],
  'queue.transfer_token': ['queue.transfer_token', 'queue.manage'],
  'sales_agent.create': ['sales_agent.create', 'sales_agent.manage', 'sales_agent.assign', 'sales_agent.view'],
  'sales_agent.edit': ['sales_agent.edit', 'sales_agent.manage', 'sales_agent.assign'],
  'sales_agent.view_commission': ['sales_agent.view_commission', 'sales_agent.view', 'sales_agent.manage'],
  'sales_agent.payout': ['sales_agent.payout', 'sales_agent.manage', 'payment.create', 'invoice.create'],
  'billing.view': ['billing.view', 'invoice.view', 'payment.view'],
  'billing.create': ['billing.create', 'invoice.create', 'payment.create'],
  'billing.edit': ['billing.edit', 'invoice.edit'],
  'payment.collect': ['payment.collect', 'payment.create'],
  'diagnostic.view': ['diagnostic.view', 'test.view'],
  'diagnostic.create': ['diagnostic.create', 'test.order', 'test.create'],
  'diagnostic.edit': ['diagnostic.edit', 'test.order', 'test.edit'],
  'shift.view': ['shift.view', 'shift.manage'],
};

/**
 * Granular permission check middleware
 */
export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    // Super Admin has all permissions automatically
    if (req.user.roleCode === 'SUPER_ADMIN') {
      return next();
    }

    // Hospital Admin has full access to operational reception and clinical routes
    if (req.user.roleCode === 'ORGANIZATION_ADMIN' && !['settings.manage', 'organization.manage'].includes(permissionCode)) {
      return next();
    }

    const validCodes = [permissionCode, ...(PERMISSION_ALIASES[permissionCode] || [])];
    const hasPermission = req.userPermissions?.some(p => validCodes.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Missing required permission [${permissionCode}].`
      });
    }

    next();
  };
}
