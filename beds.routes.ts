/**
 * Pattern HMS - Hospital Bed, Ward & Room Configuration Routes
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Bed Types
router.get('/types', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: db.raw.bedTypes });
});

router.post('/types', authenticate, requirePermission('bed.manage'), (req: AuthRequest, res: Response): any => {
  const { name, code, description } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'Name and Code required.' });

  const newType = {
    id: 'bt_' + Math.random().toString(36).substr(2, 8),
    name,
    code: code.toUpperCase().trim(),
    description: description || '',
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString()
  };
  db.raw.bedTypes.push(newType);
  db.persist();

  return res.status(201).json({ success: true, data: newType });
});

// Wards
router.get('/wards', authenticate, requirePermission('bed.view'), (req: AuthRequest, res: Response) => {
  const { branchId } = req.query as any;
  const list = db.raw.wards.filter(w => {
    if (w.deletedAt) return false;
    if (branchId && w.branchId !== branchId) return false;
    return true;
  });

  const enriched = list.map(w => {
    const wardBeds = db.raw.beds.filter(b => b.wardId === w.id && !b.deletedAt);
    const occupied = wardBeds.filter(b => b.status === 'OCCUPIED').length;
    const available = wardBeds.filter(b => b.status === 'AVAILABLE').length;
    return {
      ...w,
      totalBeds: wardBeds.length,
      occupiedBeds: occupied,
      availableBeds: available,
      occupancyRate: wardBeds.length > 0 ? Math.round((occupied / wardBeds.length) * 100) : 0
    };
  });

  res.json({ success: true, data: enriched });
});

router.post('/wards', authenticate, requirePermission('bed.manage'), (req: AuthRequest, res: Response): any => {
  const { name, code, floor, branchId, departmentId, totalCapacity } = req.body;
  if (!name || !code || !branchId) {
    return res.status(400).json({ success: false, message: 'Name, Code, and Branch are required.' });
  }

  const newWard = {
    id: 'wrd_' + Math.random().toString(36).substr(2, 8),
    name,
    code: code.toUpperCase().trim(),
    floor: floor || '1st Floor',
    branchId,
    departmentId: departmentId || '',
    totalCapacity: Number(totalCapacity) || 20,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString()
  };
  db.raw.wards.push(newWard);
  db.persist();

  return res.status(201).json({ success: true, data: newWard });
});

// Rooms
router.get('/rooms', authenticate, requirePermission('bed.view'), (req: AuthRequest, res: Response) => {
  const { wardId } = req.query as any;
  const list = db.raw.rooms.filter(r => {
    if (r.deletedAt) return false;
    if (wardId && r.wardId !== wardId) return false;
    return true;
  });
  res.json({ success: true, data: list });
});

router.post('/rooms', authenticate, requirePermission('bed.manage'), (req: AuthRequest, res: Response): any => {
  const { wardId, roomNumber, roomType, capacity } = req.body;
  if (!wardId || !roomNumber) return res.status(400).json({ success: false, message: 'Ward and Room Number required.' });

  const newRoom = {
    id: 'rm_' + Math.random().toString(36).substr(2, 8),
    wardId,
    roomNumber,
    roomType: roomType || 'Standard',
    capacity: Number(capacity) || 1,
    status: 'AVAILABLE' as const,
    createdAt: new Date().toISOString()
  };
  db.raw.rooms.push(newRoom);
  db.persist();

  return res.status(201).json({ success: true, data: newRoom });
});

// Beds
router.get('/', authenticate, requirePermission('bed.view'), (req: AuthRequest, res: Response) => {
  const { branchId, wardId, status } = req.query as any;
  const list = db.raw.beds.filter(b => {
    if (b.deletedAt) return false;
    if (branchId && b.branchId !== branchId) return false;
    if (wardId && b.wardId !== wardId) return false;
    if (status && b.status !== status) return false;
    return true;
  });

  const enriched = list.map(b => {
    const ward = db.raw.wards.find(w => w.id === b.wardId);
    const room = db.raw.rooms.find(r => r.id === b.roomId);
    const type = db.raw.bedTypes.find(t => t.id === b.bedTypeId);
    return {
      ...b,
      wardName: ward ? ward.name : 'General Ward',
      roomNumber: room ? room.roomNumber : 'General Hall',
      bedTypeName: type ? type.name : 'Standard Bed'
    };
  });

  res.json({ success: true, data: enriched });
});

router.post('/', authenticate, requirePermission('bed.manage'), (req: AuthRequest, res: Response): any => {
  const { bedNumber, roomId, wardId, bedTypeId, branchId, pricePerDay, status } = req.body;
  if (!bedNumber || !wardId || !branchId) {
    return res.status(400).json({ success: false, message: 'Bed Number, Ward, and Branch are required.' });
  }

  const newBed = {
    id: 'bed_' + Math.random().toString(36).substr(2, 8),
    bedNumber,
    roomId: roomId || '',
    wardId,
    bedTypeId: bedTypeId || 'bt_gen',
    branchId,
    pricePerDay: Number(pricePerDay) || 75,
    status: status || 'AVAILABLE',
    currentPatientMaskedId: null,
    createdAt: new Date().toISOString()
  };
  db.raw.beds.push(newBed);
  db.persist();

  return res.status(201).json({ success: true, message: 'Bed registered', data: newBed });
});

router.patch('/:id', authenticate, requirePermission('bed.manage'), (req: AuthRequest, res: Response): any => {
  const bed = db.raw.beds.find(b => b.id === req.params.id && !b.deletedAt);
  if (!bed) return res.status(404).json({ success: false, message: 'Bed not found' });

  const oldStatus = bed.status;
  Object.assign(bed, req.body);
  db.persist();

  if (req.body.status && req.body.status !== oldStatus) {
    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'UPDATE_BED_STATUS',
      'Bed',
      bed.id,
      { status: oldStatus },
      { status: bed.status }
    );
  }

  return res.json({ success: true, message: 'Bed updated', data: bed });
});

export default router;
