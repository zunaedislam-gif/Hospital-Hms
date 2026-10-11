/**
 * Pattern HMS - Organizations & Branches Routes
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/organizations
router.get('/', authenticate, requirePermission('organization.view'), (req: AuthRequest, res: Response) => {
  const orgs = db.getOrganizations();
  const enhanced = orgs.map(org => {
    const branches = db.getBranches(org.id);
    const users = db.getUsers({ orgId: org.id });
    const doctors = db.getDoctors({ orgId: org.id });
    return {
      ...org,
      branchCount: branches.length,
      userCount: users.length,
      doctorCount: doctors.length
    };
  });

  res.json({
    success: true,
    data: enhanced,
    total: enhanced.length
  });
});

// GET /api/organizations/:id
router.get('/:id', authenticate, requirePermission('organization.view'), (req: AuthRequest, res: Response): any => {
  const org = db.getOrganizationById(req.params.id);
  if (!org) {
    return res.status(404).json({ success: false, message: 'Organization not found' });
  }

  const branches = db.getBranches(org.id);
  const departments = db.raw.departments.filter(d => d.organizationId === org.id && !d.deletedAt);
  const doctors = db.getDoctors({ orgId: org.id });

  return res.json({
    success: true,
    data: {
      ...org,
      branches,
      departments,
      doctors
    }
  });
});

// POST /api/organizations
router.post('/', authenticate, requirePermission('organization.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const { name, type, registrationNumber, contactNumber, email, address, country, city, timezone, currency } = req.body;
    if (!name || !type || !registrationNumber || !contactNumber || !email) {
      return res.status(400).json({ success: false, message: 'Missing required organization fields.' });
    }

    const newOrg = db.createOrganization({
      name,
      type: type || 'HOSPITAL',
      registrationNumber,
      contactNumber,
      email,
      website: req.body.website || '',
      address: address || '',
      country: country || 'United States',
      state: req.body.state || '',
      city: city || '',
      postalCode: req.body.postalCode || '',
      timezone: timezone || 'America/Los_Angeles',
      currency: currency || 'USD',
      taxVatNumber: req.body.taxVatNumber || '',
      emergencyContact: req.body.emergencyContact || contactNumber,
      status: req.body.status || 'ACTIVE'
    }, { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode });

    return res.status(201).json({
      success: true,
      message: 'Organization registered successfully',
      data: newOrg
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/organizations/:id
router.patch('/:id', authenticate, requirePermission('organization.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.updateOrganization(req.params.id, req.body, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });
    return res.json({ success: true, message: 'Organization updated successfully', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/organizations/:id
router.delete('/:id', authenticate, requirePermission('organization.manage'), (req: AuthRequest, res: Response): any => {
  try {
    db.deleteOrganization(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });
    return res.json({ success: true, message: 'Organization archived successfully' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// Branches
// ----------------------------------------------------

// GET /api/organizations/branches/all
router.get('/branches/all', authenticate, requirePermission('organization.view'), (req: AuthRequest, res: Response) => {
  const orgId = req.query.orgId as string | undefined;
  const branches = db.getBranches(orgId);
  res.json({ success: true, data: branches });
});

// POST /api/organizations/branches
router.post('/branches/create', authenticate, requirePermission('branch.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const { organizationId, name, code, address, phone, email, manager, openingTime, closingTime, emergencyStatus } = req.body;
    if (!organizationId || !name || !code) {
      return res.status(400).json({ success: false, message: 'Organization ID, Branch Name, and Code are required.' });
    }

    const newBranch = db.createBranch({
      organizationId,
      name,
      code,
      address: address || '',
      phone: phone || '',
      email: email || '',
      manager: manager || '',
      openingTime: openingTime || '08:00',
      closingTime: closingTime || '20:00',
      emergencyStatus: Boolean(emergencyStatus),
      timezone: req.body.timezone || 'America/Los_Angeles',
      status: req.body.status || 'ACTIVE'
    }, { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode });

    return res.status(201).json({ success: true, message: 'Branch created successfully', data: newBranch });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/organizations/branches/:id
router.patch('/branches/:id', authenticate, requirePermission('branch.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.updateBranch(req.params.id, req.body, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });
    return res.json({ success: true, message: 'Branch updated successfully', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/organizations/branches/:id
router.delete('/branches/:id', authenticate, requirePermission('branch.manage'), (req: AuthRequest, res: Response): any => {
  try {
    db.deleteBranch(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });
    return res.json({ success: true, message: 'Branch archived successfully' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
