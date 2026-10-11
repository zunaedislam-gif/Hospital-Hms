/**
 * Pattern HMS - User Management & RBAC Routes
 */
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/store.js';
import { SYSTEM_PERMISSIONS } from '../db/schema.js';
import { authenticate, requirePermission, requireSuperAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/users
router.get('/', authenticate, requirePermission('user.view'), (req: AuthRequest, res: Response) => {
  const { roleCode, orgId, branchId, status, search, page = '1', limit = '20' } = req.query as any;

  const users = db.getUsers({
    roleCode: roleCode as string,
    orgId: orgId as string,
    branchId: branchId as string,
    status: status as string,
    search: search as string
  });

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = users.slice(startIndex, startIndex + limitNum);

  // Strip password hash for security
  const safeUsers = paginated.map(u => {
    const { passwordHash: _, ...rest } = u;
    const org = u.organizationId ? db.getOrganizationById(u.organizationId) : null;
    const branch = u.branchId ? db.getBranchById(u.branchId) : null;
    const role = db.raw.roles.find(r => r.code === u.roleCode);
    return {
      ...rest,
      organizationName: org ? org.name : 'Platform Level',
      branchName: branch ? branch.name : 'All Branches',
      roleName: role ? role.name : u.roleCode
    };
  });

  res.json({
    success: true,
    data: safeUsers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: users.length,
      totalPages: Math.ceil(users.length / limitNum)
    }
  });
});

// POST /api/users
router.post('/', authenticate, requirePermission('user.create'), (req: AuthRequest, res: Response): any => {
  try {
    const { fullName, username, email, phone, roleCode, organizationId, branchId, departmentId, designation, password } = req.body;

    if (!fullName || !username || !email || !roleCode || !designation) {
      return res.status(400).json({ success: false, message: 'Missing required user fields.' });
    }

    const defaultPassword = password || 'Pattern@123';
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);

    const newUser = db.createUser({
      fullName,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      employeeId: req.body.employeeId || 'EMP-' + Math.floor(1000 + Math.random() * 9000),
      roleCode,
      organizationId: organizationId || null,
      branchId: branchId || null,
      departmentId: departmentId || null,
      designation,
      status: req.body.status || 'ACTIVE',
      passwordHash,
      twoFactorEnabled: false,
      lastLogin: null
    }, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });

    const { passwordHash: _, ...safeUser } = newUser;
    return res.status(201).json({
      success: true,
      message: 'User account created successfully',
      data: safeUser
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/:id
router.patch('/:id', authenticate, requirePermission('user.edit'), (req: AuthRequest, res: Response): any => {
  try {
    const updates = { ...req.body };
    delete updates.passwordHash; // Protect password from general update endpoint

    const updated = db.updateUser(req.params.id, updates, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });

    const { passwordHash: _, ...safeUser } = updated;
    return res.json({ success: true, message: 'User updated successfully', data: safeUser });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/users/:id/reset-password
router.post('/:id/reset-password', authenticate, requirePermission('user.suspend'), (req: AuthRequest, res: Response): any => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newPassword = req.body.newPassword || 'Reset@Pattern2026';
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.updatedAt = new Date().toISOString();
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'ADMIN_RESET_PASSWORD',
      'User',
      user.id,
      null,
      { resetBy: req.user!.email }
    );

    return res.json({
      success: true,
      message: `Password reset successfully for ${user.fullName}. Temporary password: ${newPassword}`
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/users/:id/suspend
router.post('/:id/suspend', authenticate, requirePermission('user.suspend'), (req: AuthRequest, res: Response): any => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.roleCode === 'SUPER_ADMIN' && req.user!.id === user.id) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own Super Admin account' });
    }

    const previousStatus = user.status;
    user.status = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    user.updatedAt = new Date().toISOString();
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      user.status === 'SUSPENDED' ? 'SUSPEND_USER' : 'ACTIVATE_USER',
      'User',
      user.id,
      { status: previousStatus },
      { status: user.status }
    );

    return res.json({
      success: true,
      message: `User status changed to ${user.status}`,
      status: user.status
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/users/:id/unlock
router.post('/:id/unlock', authenticate, requirePermission('user.suspend'), (req: AuthRequest, res: Response): any => {
  try {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.status = 'ACTIVE';
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.updatedAt = new Date().toISOString();
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'UNLOCK_USER',
      'User',
      user.id,
      { status: 'LOCKED' },
      { status: 'ACTIVE' }
    );

    return res.json({ success: true, message: 'User account unlocked successfully.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, requirePermission('user.suspend'), (req: AuthRequest, res: Response): any => {
  try {
    db.deleteUser(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });
    return res.json({ success: true, message: 'User soft-deleted/archived successfully' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// Roles & Granular Permissions
// ----------------------------------------------------

// GET /api/users/roles
router.get('/roles/all', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: db.raw.roles });
});

// POST /api/users/roles
router.post('/roles/create', authenticate, requireSuperAdmin, (req: AuthRequest, res: Response): any => {
  try {
    const { code, name, description, permissions } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Role code and name are required.' });
    }

    const existing = db.raw.roles.find(r => r.code.toUpperCase() === code.toUpperCase());
    if (existing) {
      return res.status(400).json({ success: false, message: `Role code '${code}' already exists.` });
    }

    const newRole = {
      id: 'role_' + Math.random().toString(36).substr(2, 8),
      code: code.toUpperCase().trim(),
      name,
      description: description || '',
      isSystemRole: false,
      permissions: Array.isArray(permissions) ? permissions : [],
      createdAt: new Date().toISOString()
    };
    db.raw.roles.push(newRole);
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'CREATE_ROLE',
      'Role',
      newRole.id,
      null,
      newRole
    );

    return res.status(201).json({ success: true, message: 'Custom role created successfully', data: newRole });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/users/roles/:id/permissions
router.patch('/roles/:id/permissions', authenticate, requireSuperAdmin, (req: AuthRequest, res: Response): any => {
  try {
    const role = db.raw.roles.find(r => r.id === req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });

    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'Permissions must be an array of permission codes.' });
    }

    const oldPerms = [...role.permissions];
    role.permissions = permissions;
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'UPDATE_ROLE_PERMISSIONS',
      'Role',
      role.id,
      { permissions: oldPerms },
      { permissions: role.permissions }
    );

    return res.json({ success: true, message: `Permissions updated for role ${role.name}`, data: role });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/users/permissions/catalog
router.get('/permissions/catalog', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: SYSTEM_PERMISSIONS });
});

export default router;
