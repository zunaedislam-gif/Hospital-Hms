/**
 * Pattern HMS - Queue System & Waiting Room Display Routes
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ----------------------------------------------------
// Queue Configurations
// ----------------------------------------------------
router.get('/config', authenticate, requirePermission('queue.view'), (req: AuthRequest, res: Response) => {
  const { branchId, orgId } = req.query as any;
  const list = db.raw.queueConfigurations.filter(q => {
    if (branchId && q.branchId !== branchId) return false;
    if (orgId && q.organizationId !== orgId) return false;
    return true;
  });
  res.json({ success: true, data: list });
});

router.post('/config', authenticate, requirePermission('queue.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const {
      organizationId, branchId, prefix, startingToken, dailyReset,
      numberingFormat, maxQueueSize, priorityPatientSupport,
      emergencyPatientSupport, displayDurationSeconds, callingIntervalSeconds,
      nextPatientsCount, queueSound, voiceAnnouncement, language, displayTheme,
      autoRefreshIntervalSeconds
    } = req.body;

    if (!organizationId || !branchId || !prefix) {
      return res.status(400).json({ success: false, message: 'Organization, Branch, and Token Prefix required.' });
    }

    const existingIdx = db.raw.queueConfigurations.findIndex(q => q.branchId === branchId);

    const configData = {
      id: existingIdx >= 0 ? db.raw.queueConfigurations[existingIdx].id : 'qc_' + Math.random().toString(36).substr(2, 8),
      organizationId,
      branchId,
      prefix: prefix.toUpperCase().trim(),
      startingToken: Number(startingToken) || 1,
      dailyReset: dailyReset !== undefined ? Boolean(dailyReset) : true,
      numberingFormat: numberingFormat || '{PREFIX}-{NUMBER}',
      maxQueueSize: Number(maxQueueSize) || 300,
      priorityPatientSupport: Boolean(priorityPatientSupport),
      emergencyPatientSupport: Boolean(emergencyPatientSupport),
      displayDurationSeconds: Number(displayDurationSeconds) || 15,
      callingIntervalSeconds: Number(callingIntervalSeconds) || 10,
      nextPatientsCount: Number(nextPatientsCount) || 4,
      queueSound: queueSound || 'CHIME',
      voiceAnnouncement: voiceAnnouncement !== undefined ? Boolean(voiceAnnouncement) : true,
      language: language || 'en',
      displayTheme: displayTheme || 'HEALTHCARE_BLUE',
      autoRefreshIntervalSeconds: Number(autoRefreshIntervalSeconds) || 5,
      createdAt: new Date().toISOString()
    };

    if (existingIdx >= 0) {
      const old = db.raw.queueConfigurations[existingIdx];
      db.raw.queueConfigurations[existingIdx] = configData;
      db.logAudit(
        { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
        'CONFIG_QUEUE_RULES',
        'QueueConfiguration',
        configData.id,
        old,
        configData
      );
    } else {
      db.raw.queueConfigurations.push(configData);
      db.logAudit(
        { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
        'CREATE_QUEUE_CONFIG',
        'QueueConfiguration',
        configData.id,
        null,
        configData
      );
    }

    db.persist();

    return res.status(200).json({
      success: true,
      message: 'Queue configuration saved successfully',
      data: configData
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// Waiting Room Display Screens
// ----------------------------------------------------
router.get('/displays', authenticate, requirePermission('display.view'), (req: AuthRequest, res: Response) => {
  const { branchId } = req.query as any;
  const list = db.raw.displayScreens.filter(d => {
    if (d.deletedAt) return false;
    if (branchId && d.branchId !== branchId) return false;
    return true;
  });

  const enriched = list.map(d => {
    const org = db.getOrganizationById(d.organizationId);
    const branch = db.getBranchById(d.branchId);
    const chambers = db.raw.chambers.filter(c => d.assignedChamberIds.includes(c.id));
    return {
      ...d,
      organizationName: org ? org.name : '',
      branchName: branch ? branch.name : '',
      chambers: chambers.map(c => ({ id: c.id, name: c.name, number: c.number }))
    };
  });

  res.json({ success: true, data: enriched });
});

router.post('/displays', authenticate, requirePermission('display.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const {
      name, displayCode, organizationId, branchId, waitingRoomName,
      assignedChamberIds, assignedDoctorIds, screenType, orientation,
      language, theme
    } = req.body;

    if (!name || !displayCode || !organizationId || !branchId) {
      return res.status(400).json({ success: false, message: 'Display Name, Code, Organization and Branch required.' });
    }

    const displayToken = 'd_tok_' + Math.random().toString(36).substr(2, 12);

    const newDisplay = {
      id: 'disp_' + Math.random().toString(36).substr(2, 8),
      name,
      displayCode: displayCode.toUpperCase().trim(),
      displayToken,
      organizationId,
      branchId,
      waitingRoomName: waitingRoomName || 'Main Waiting Room',
      assignedChamberIds: Array.isArray(assignedChamberIds) ? assignedChamberIds : [],
      assignedDoctorIds: Array.isArray(assignedDoctorIds) ? assignedDoctorIds : [],
      screenType: screenType || 'DOCTOR_QUEUE',
      orientation: orientation || 'LANDSCAPE',
      language: language || 'en',
      theme: theme || 'HEALTHCARE_BLUE',
      status: 'ONLINE' as const,
      lastPingAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    db.raw.displayScreens.push(newDisplay);
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'CREATE_DISPLAY_SCREEN',
      'DisplayScreen',
      newDisplay.id,
      null,
      newDisplay
    );

    return res.status(201).json({ success: true, message: 'Display screen configured successfully', data: newDisplay });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/displays/:id', authenticate, requirePermission('display.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const disp = db.raw.displayScreens.find(d => d.id === req.params.id && !d.deletedAt);
    if (!disp) return res.status(404).json({ success: false, message: 'Display not found' });

    Object.assign(disp, req.body);
    disp.lastPingAt = new Date().toISOString();
    db.persist();

    return res.json({ success: true, message: 'Display configuration updated', data: disp });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/queue/display-feed/:token (Display preview stream - Privacy Guaranteed)
router.get('/display-feed/:token', (req, res): any => {
  const disp = db.raw.displayScreens.find(d => d.displayToken === req.params.token && !d.deletedAt);
  if (!disp) {
    return res.status(404).json({ success: false, message: 'Display screen token invalid or revoked.' });
  }

  // Find assigned chambers
  const chambers = db.raw.chambers.filter(c => disp.assignedChamberIds.includes(c.id));
  
  // Strict Healthcare Privacy Standard:
  // Public display NEVER returns patient diagnosis, full phone, address, or sensitive clinical data!
  const serving = chambers.map(c => {
    const doc = c.assignedDoctorId ? db.getDoctorById(c.assignedDoctorId) : null;
    return {
      chamberName: c.name,
      chamberNumber: c.number,
      doctorName: doc ? doc.fullName : 'Attending Specialist',
      currentToken: c.currentQueueToken || 'STANDBY',
      status: c.status
    };
  });

  return res.json({
    success: true,
    data: {
      screenName: disp.name,
      waitingRoom: disp.waitingRoomName,
      theme: disp.theme,
      orientation: disp.orientation,
      serving,
      nextTokens: ['A-105', 'A-106', 'A-107'],
      announcementMessage: 'Please watch for your token number and proceed to the designated chamber.',
      serverTime: new Date().toISOString()
    }
  });
});

// ----------------------------------------------------
// Live Queue Tokens & Dispatch Control
// ----------------------------------------------------

// Ensure default queue tokens exist in database
function ensureDefaultQueueTokens() {
  if (!db.raw.queueEntries) {
    db.raw.queueEntries = [];
  }

  const defaultTokens = [
    {
      id: 'q-1',
      tokenNumber: 'A-012',
      sequenceNumber: 12,
      patientId: 'pat_001',
      patientName: 'Emily Clark',
      patientPhone: '01711223344',
      patientAge: 29,
      patientGender: 'FEMALE' as const,
      doctorId: 'doc_rahman',
      doctorName: 'Dr. Sarah Mitchell, MD',
      departmentName: 'Cardiology Clinic',
      chamberId: 'chmb_101',
      chamberName: 'Room 101 - Cardiology Clinic',
      chamberNumber: '101',
      status: 'CALLED' as const,
      visitType: 'WALK_IN' as const,
      timeWaitingMinutes: 14,
      estimatedWaitMinutes: 12,
      isEmergency: false,
      calledCount: 1,
      lastCalledAt: new Date().toISOString(),
      branchId: 'br_pch_main',
      organizationId: 'org_pch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'q-2',
      tokenNumber: 'A-013',
      sequenceNumber: 13,
      patientId: 'pat_002',
      patientName: 'Marcus Vance',
      patientPhone: '01811223344',
      patientAge: 45,
      patientGender: 'MALE' as const,
      doctorId: 'doc_rahman',
      doctorName: 'Dr. Sarah Mitchell, MD',
      departmentName: 'Cardiology Clinic',
      chamberId: 'chmb_101',
      chamberName: 'Room 101 - Cardiology Clinic',
      chamberNumber: '101',
      status: 'WAITING' as const,
      visitType: 'WALK_IN' as const,
      timeWaitingMinutes: 28,
      estimatedWaitMinutes: 24,
      isEmergency: false,
      calledCount: 0,
      branchId: 'br_pch_main',
      organizationId: 'org_pch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'q-3',
      tokenNumber: 'E-003',
      sequenceNumber: 3,
      patientId: 'pat_003',
      patientName: 'Jonathan Davis',
      patientPhone: '01911223344',
      patientAge: 62,
      patientGender: 'MALE' as const,
      doctorId: 'doc_fatima',
      doctorName: 'Dr. Michael Chang, FRCS',
      departmentName: 'Neurology Suite',
      chamberId: 'chmb_204',
      chamberName: 'Room 204 - Neurology Suite',
      chamberNumber: '204',
      status: 'WAITING' as const,
      visitType: 'WALK_IN' as const,
      timeWaitingMinutes: 5,
      estimatedWaitMinutes: 5,
      isEmergency: true,
      calledCount: 0,
      branchId: 'br_pch_main',
      organizationId: 'org_pch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'q-4',
      tokenNumber: 'B-008',
      sequenceNumber: 8,
      patientId: 'pat_004',
      patientName: 'Sophia Patel',
      patientPhone: '01611223344',
      patientAge: 38,
      patientGender: 'FEMALE' as const,
      doctorId: 'doc_alvi',
      doctorName: 'Dr. Elena Rostova, MD',
      departmentName: 'Endocrinology',
      chamberId: 'chmb_105',
      chamberName: 'Room 105 - Endocrinology',
      chamberNumber: '105',
      status: 'IN_CONSULTATION' as const,
      visitType: 'WALK_IN' as const,
      timeWaitingMinutes: 42,
      estimatedWaitMinutes: 30,
      isEmergency: false,
      calledCount: 1,
      branchId: 'br_pch_main',
      organizationId: 'org_pch',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const def of defaultTokens) {
    const exists = db.raw.queueEntries.some(q => q.id === def.id || q.tokenNumber === def.tokenNumber);
    if (!exists) {
      db.raw.queueEntries.push(def as any);
    }
  }
}

// GET /api/queue/items - Retrieve all active live queue tokens
router.get('/items', (req, res) => {
  ensureDefaultQueueTokens();
  const list = (db.raw.queueEntries || []).map((q: any) => ({
    id: q.id,
    tokenNumber: q.tokenNumber,
    sequenceNumber: q.sequenceNumber,
    patientId: q.patientId || 'pat_001',
    patientName: q.patientName,
    doctorName: q.doctorName,
    departmentName: q.departmentName || (q.chamberNumber ? `Chamber ${q.chamberNumber}` : 'General Outpatient'),
    chamberName: q.chamberName || (q.chamberNumber ? `Chamber ${q.chamberNumber}` : 'Consultation Room'),
    chamberNumber: q.chamberNumber || '101',
    status: q.status,
    timeWaitingMinutes: q.timeWaitingMinutes || Math.max(5, Math.floor((Date.now() - new Date(q.createdAt || Date.now()).getTime()) / 60000)),
    estimatedWaitMinutes: q.estimatedWaitMinutes || 15,
    isEmergency: q.isEmergency || q.priority === 'EMERGENCY',
    branchId: q.branchId,
    organizationId: q.organizationId,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt
  }));

  res.json({ success: true, data: list });
});

// POST /api/queue/items/:id/call or POST /api/queue/call
const handleCallQueueItem = (tokenId: string, req: any, res: any) => {
  ensureDefaultQueueTokens();
  const item = db.raw.queueEntries.find(q => q.id === tokenId || q.tokenNumber === tokenId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Queue token not found' });
  }

  item.status = 'CALLED';
  item.calledCount = (item.calledCount || 0) + 1;
  item.lastCalledAt = new Date().toISOString();
  item.updatedAt = new Date().toISOString();
  db.persist();

  return res.json({
    success: true,
    message: `Token ${item.tokenNumber} is now being called to Chamber ${item.chamberNumber || ''}`,
    data: item
  });
};

router.post('/items/:id/call', (req, res) => {
  return handleCallQueueItem(req.params.id, req, res);
});

router.post('/call', (req, res) => {
  const { tokenId } = req.body;
  return handleCallQueueItem(tokenId, req, res);
});

// POST /api/queue/items/:id/status or PATCH /api/queue/items/:id/status or POST /api/queue/status
const handleStatusUpdate = (tokenId: string, status: string, req: any, res: any) => {
  ensureDefaultQueueTokens();
  const item = db.raw.queueEntries.find(q => q.id === tokenId || q.tokenNumber === tokenId);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Queue token not found' });
  }

  item.status = status as any;
  item.updatedAt = new Date().toISOString();
  if (status === 'COMPLETED') {
    item.completedAt = new Date().toISOString();
  }
  db.persist();

  return res.json({
    success: true,
    message: `Token ${item.tokenNumber} status updated to ${status}`,
    data: item
  });
};

router.post('/items/:id/status', (req, res) => {
  const { status } = req.body;
  return handleStatusUpdate(req.params.id, status, req, res);
});

router.patch('/items/:id/status', (req, res) => {
  const { status } = req.body;
  return handleStatusUpdate(req.params.id, status, req, res);
});

router.post('/status', (req, res) => {
  const { tokenId, status } = req.body;
  return handleStatusUpdate(tokenId, status, req, res);
});

// Specific action shortcuts: /consult and /complete
router.post('/items/:id/consult', (req, res) => {
  return handleStatusUpdate(req.params.id, 'IN_CONSULTATION', req, res);
});

router.post('/items/:id/complete', (req, res) => {
  return handleStatusUpdate(req.params.id, 'COMPLETED', req, res);
});

router.post('/items/:id/skip', (req, res) => {
  return handleStatusUpdate(req.params.id, 'SKIPPED', req, res);
});

// Sound Settings & Rules
let queueSoundSettingsCache = {
  id: 'sound-config-1',
  enableVoiceAnnouncement: true,
  chimeTone: 'AIRPORT_CHIME',
  voiceLanguage: 'en-US',
  volumePercent: 85,
  repeatTimes: 2,
  announcementFormat: 'Token {token}, please proceed to {chamber}'
};

let queueRulesCache = {
  id: 'rule-config-1',
  anonymizePatientNameOnDisplay: 'INITIALS_ONLY',
  estimatedMinutesPerPatient: 15,
  maxAutoRecalls: 3,
  priorityQueueForEmergency: true,
  enableSmsTokenNotification: true
};

router.get('/sound-settings', (req, res) => {
  res.json({ success: true, data: queueSoundSettingsCache });
});

router.post('/sound-settings', (req, res) => {
  queueSoundSettingsCache = { ...queueSoundSettingsCache, ...req.body };
  res.json({ success: true, message: 'Acoustic settings updated', data: queueSoundSettingsCache });
});

router.get('/rules', (req, res) => {
  res.json({ success: true, data: queueRulesCache });
});

router.post('/rules', (req, res) => {
  queueRulesCache = { ...queueRulesCache, ...req.body };
  res.json({ success: true, message: 'Queue rules updated', data: queueRulesCache });
});

export default router;
