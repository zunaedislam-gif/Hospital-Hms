/**
 * Pattern HMS - Doctor Panel Clinical Routes
 * Covers: Doctor Availability & Prayer Break, Live Chamber Queue, Calling Next Patient,
 * Consultation Workspace, Clinical Documentation, Diagnosis, Vitals, Prescriptions,
 * and In-Chamber Diagnostic Test Ordering.
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { realtimeHub } from '../realtime.js';
import { Consultation, Prescription, DoctorAvailabilityState, TestOrder, TestOrderItem } from '../types.js';

const router = Router();

// Helper to determine doctor ID from user session or query
function resolveDoctor(req: AuthRequest) {
  // If user is a DOCTOR, find their matching doctor profile
  const user = req.user!;
  let doc = db.raw.doctors.find(d => d.userId === user.id || d.email?.toLowerCase() === user.email?.toLowerCase());

  // If not found or if user is admin overriding with ?doctorId=
  const queryDocId = req.query.doctorId as string || req.body?.doctorId;
  if (queryDocId) {
    const override = db.raw.doctors.find(d => d.id === queryDocId || d.doctorId === queryDocId);
    if (override) return override;
  }

  // Fallback to first doctor if admin testing
  if (!doc && (user.roleCode === 'SUPER_ADMIN' || user.roleCode === 'ORGANIZATION_ADMIN')) {
    doc = db.raw.doctors[0];
  }

  return doc || null;
}

// ----------------------------------------------------
// 1. Doctor Dashboard & Clinical Overview
// ----------------------------------------------------
router.get('/dashboard', authenticate, (req: AuthRequest, res: Response): any => {
  const doc = resolveDoctor(req);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Doctor profile not found for this account' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const queueEntries = (db.raw.queueEntries || []).filter(q => {
    const matchDoc = q.doctorId === doc.id || q.doctorName?.includes(doc.fullName) || q.doctorName?.includes(doc.doctorId);
    return matchDoc;
  });

  const waitingPatients = queueEntries.filter(q => q.status === 'WAITING');
  const currentServing = queueEntries.find(q => q.status === 'CALLED' || q.status === 'IN_CONSULTATION');
  const completedToday = queueEntries.filter(q => q.status === 'COMPLETED');
  const skippedToday = queueEntries.filter(q => q.status === 'SKIPPED');

  const docAvail = (db.raw.doctorAvailabilities || []).find(a => a.doctorId === doc.id) || {
    doctorId: doc.id,
    doctorName: doc.fullName,
    status: (doc.status as any) || 'AVAILABLE',
    lastUpdatedAt: new Date().toISOString()
  };

  const chamber = doc.chamberId ? db.raw.chambers.find(c => c.id === doc.chamberId) : null;

  // Pending lab results for this doctor's patients
  const pendingLabOrders = (db.raw.testOrders || []).filter(t => 
    (t.doctorId === doc.id || t.doctorName?.includes(doc.fullName)) && 
    t.status !== 'VERIFIED' && t.status !== 'DELIVERED' && t.status !== 'CANCELLED'
  );

  return res.json({
    success: true,
    data: {
      doctor: {
        id: doc.id,
        doctorId: doc.doctorId,
        fullName: doc.fullName,
        specialtyName: doc.specialtyName,
        qualifications: doc.qualifications,
        medicalRegNumber: doc.medicalRegNumber,
        departmentId: doc.departmentId,
        chamberNumber: chamber ? chamber.number : '101',
        chamberName: chamber ? chamber.name : 'Consultation Room'
      },
      availability: docAvail,
      metrics: {
        todayTotal: queueEntries.length,
        waitingCount: waitingPatients.length,
        currentToken: currentServing ? currentServing.tokenNumber : null,
        currentPatientName: currentServing ? currentServing.patientName : null,
        completedCount: completedToday.length,
        skippedCount: skippedToday.length,
        pendingLabCount: pendingLabOrders.length,
        followUpsTodayCount: 2
      }
    }
  });
});

// ----------------------------------------------------
// 2. Doctor Availability & Dedicated Break/Prayer Workflow
// ----------------------------------------------------
router.get('/status', authenticate, (req: AuthRequest, res: Response): any => {
  const doc = resolveDoctor(req);
  if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });

  if (!db.raw.doctorAvailabilities) db.raw.doctorAvailabilities = [];
  let state = db.raw.doctorAvailabilities.find(a => a.doctorId === doc.id);
  if (!state) {
    state = {
      doctorId: doc.id,
      doctorName: doc.fullName,
      status: (doc.status as any) || 'AVAILABLE',
      lastUpdatedAt: new Date().toISOString()
    };
    db.raw.doctorAvailabilities.push(state);
  }

  return res.json({ success: true, data: state });
});

router.post('/status', authenticate, (req: AuthRequest, res: Response): any => {
  const doc = resolveDoctor(req);
  if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });

  const { status, breakType, expectedReturnTime, breakNotes } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

  if (!db.raw.doctorAvailabilities) db.raw.doctorAvailabilities = [];
  let state = db.raw.doctorAvailabilities.find(a => a.doctorId === doc.id);
  if (!state) {
    state = {
      doctorId: doc.id,
      doctorName: doc.fullName,
      status: 'AVAILABLE',
      lastUpdatedAt: new Date().toISOString()
    };
    db.raw.doctorAvailabilities.push(state);
  }

  state.status = status;
  state.breakType = breakType || undefined;
  state.expectedReturnTime = expectedReturnTime || undefined;
  state.breakNotes = breakNotes || undefined;
  if (status === 'ON_BREAK' || status === 'ON_PRAYER_BREAK' || status === 'EMERGENCY') {
    state.breakStartedAt = new Date().toISOString();
  } else {
    state.breakStartedAt = undefined;
  }
  state.lastUpdatedAt = new Date().toISOString();

  // Also sync with doctor entity in db
  doc.status = status;
  db.persist();

  // Broadcast realtime event
  realtimeHub.broadcast('DOCTOR_STATUS_CHANGED', {
    doctorId: doc.id,
    doctorName: doc.fullName,
    status,
    breakType,
    expectedReturnTime,
    breakNotes,
    timestamp: new Date().toISOString()
  });

  if (status === 'ON_PRAYER_BREAK') {
    realtimeHub.broadcast('DOCTOR_ON_PRAYER_BREAK', { doctorId: doc.id, doctorName: doc.fullName, expectedReturnTime });
  } else if (status === 'AVAILABLE') {
    realtimeHub.broadcast('DOCTOR_AVAILABLE', { doctorId: doc.id, doctorName: doc.fullName });
  }

  return res.json({
    success: true,
    message: `Doctor status changed to ${status}`,
    data: state
  });
});

router.post('/break/start', authenticate, (req: AuthRequest, res: Response): any => {
  const doc = resolveDoctor(req);
  if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });

  const { breakType, expectedReturnTime, notes } = req.body;
  const status = breakType === 'PRAYER_BREAK' ? 'ON_PRAYER_BREAK' : breakType === 'EMERGENCY' ? 'EMERGENCY' : 'ON_BREAK';

  if (!db.raw.doctorAvailabilities) db.raw.doctorAvailabilities = [];
  let state = db.raw.doctorAvailabilities.find(a => a.doctorId === doc.id);
  if (!state) {
    state = {
      doctorId: doc.id,
      doctorName: doc.fullName,
      status: 'AVAILABLE',
      lastUpdatedAt: new Date().toISOString()
    };
    db.raw.doctorAvailabilities.push(state);
  }

  state.status = status;
  state.breakType = breakType || 'REGULAR_BREAK';
  state.expectedReturnTime = expectedReturnTime || null;
  state.breakNotes = notes || null;
  state.breakStartedAt = new Date().toISOString();
  state.lastUpdatedAt = new Date().toISOString();

  doc.status = status;
  db.persist();

  realtimeHub.broadcast('DOCTOR_STATUS_CHANGED', {
    doctorId: doc.id,
    doctorName: doc.fullName,
    status,
    breakType,
    expectedReturnTime,
    notes,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `Break registered: ${status}`,
    data: state
  });
});

router.post('/break/resume', authenticate, (req: AuthRequest, res: Response): any => {
  const doc = resolveDoctor(req);
  if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });

  if (!db.raw.doctorAvailabilities) db.raw.doctorAvailabilities = [];
  let state = db.raw.doctorAvailabilities.find(a => a.doctorId === doc.id);
  if (!state) {
    state = {
      doctorId: doc.id,
      doctorName: doc.fullName,
      status: 'AVAILABLE',
      lastUpdatedAt: new Date().toISOString()
    };
    db.raw.doctorAvailabilities.push(state);
  }

  state.status = 'AVAILABLE';
  state.breakType = undefined;
  state.expectedReturnTime = undefined;
  state.breakNotes = undefined;
  state.breakStartedAt = undefined;
  state.lastUpdatedAt = new Date().toISOString();

  doc.status = 'AVAILABLE';
  db.persist();

  realtimeHub.broadcast('DOCTOR_AVAILABLE', {
    doctorId: doc.id,
    doctorName: doc.fullName,
    status: 'AVAILABLE',
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: 'Doctor availability resumed to AVAILABLE',
    data: state
  });
});

// ----------------------------------------------------
// 3. Live Chamber Queue & Dispatch Engine
// ----------------------------------------------------
router.get('/queue', authenticate, (req: AuthRequest, res: Response): any => {
  const doc = resolveDoctor(req);
  if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });

  const allQueue = db.raw.queueEntries || [];
  const docQueue = allQueue.filter(q => {
    return q.doctorId === doc.id || q.doctorName?.includes(doc.fullName) || q.doctorName?.includes(doc.doctorId);
  });

  // Sort waiting: emergencies first, then sequenceNumber
  const waiting = docQueue.filter(q => q.status === 'WAITING').sort((a, b) => {
    if (a.isEmergency && !b.isEmergency) return -1;
    if (!a.isEmergency && b.isEmergency) return 1;
    return a.sequenceNumber - b.sequenceNumber;
  });

  const currentServing = docQueue.find(q => q.status === 'CALLED' || q.status === 'IN_CONSULTATION') || null;
  const completed = docQueue.filter(q => q.status === 'COMPLETED');
  const skipped = docQueue.filter(q => q.status === 'SKIPPED');

  return res.json({
    success: true,
    data: {
      currentServing,
      waiting,
      completed,
      skipped,
      totalCount: docQueue.length
    }
  });
});

// Call next patient atomically
router.post('/queue/call-next', authenticate, (req: AuthRequest, res: Response): any => {
  const doc = resolveDoctor(req);
  if (!doc) return res.status(404).json({ success: false, message: 'Doctor not found' });

  // Atomic check for next eligible patient
  const allQueue = db.raw.queueEntries || [];
  const eligibleQueue = allQueue
    .filter(q => q.status === 'WAITING' && (q.doctorId === doc.id || q.doctorName?.includes(doc.fullName)))
    .sort((a, b) => {
      if (a.isEmergency && !b.isEmergency) return -1;
      if (!a.isEmergency && b.isEmergency) return 1;
      return a.sequenceNumber - b.sequenceNumber;
    });

  if (eligibleQueue.length === 0) {
    return res.status(400).json({ success: false, message: 'No waiting patients in queue for this doctor' });
  }

  const nextPatient = eligibleQueue[0];
  nextPatient.status = 'CALLED';
  nextPatient.lastCalledAt = new Date().toISOString();
  nextPatient.calledCount = (nextPatient.calledCount || 0) + 1;
  nextPatient.updatedAt = new Date().toISOString();

  // Update chamber token
  if (doc.chamberId) {
    const chamber = db.raw.chambers.find(c => c.id === doc.chamberId);
    if (chamber) {
      chamber.currentQueueToken = nextPatient.tokenNumber;
      chamber.status = 'AVAILABLE';
    }
  }

  db.persist();

  // Create audit log
  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'DOCTOR_CALL_PATIENT',
    'QueueEntry',
    nextPatient.id,
    null,
    { token: nextPatient.tokenNumber, doctor: doc.fullName }
  );

  // Broadcast realtime event
  const chamberNum = nextPatient.chamberNumber || (doc.chamberId ? db.raw.chambers.find(c => c.id === doc.chamberId)?.number : '101');
  const announcementText = `Token ${nextPatient.tokenNumber}, please proceed to ${doc.fullName}, Chamber ${chamberNum}`;

  realtimeHub.broadcast('QUEUE_PATIENT_CALLED', {
    tokenNumber: nextPatient.tokenNumber,
    queueId: nextPatient.id,
    patientName: nextPatient.patientName,
    patientId: nextPatient.patientId,
    doctorId: doc.id,
    doctorName: doc.fullName,
    chamberNumber: chamberNum,
    announcementText,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `Called patient ${nextPatient.patientName} (${nextPatient.tokenNumber})`,
    data: {
      calledEntry: nextPatient,
      announcementText
    }
  });
});

// Recall current token
router.post('/queue/:id/recall', authenticate, (req: AuthRequest, res: Response): any => {
  const doc = resolveDoctor(req);
  const entry = (db.raw.queueEntries || []).find(q => q.id === req.params.id);
  if (!entry) return res.status(404).json({ success: false, message: 'Queue token not found' });

  entry.lastCalledAt = new Date().toISOString();
  entry.calledCount = (entry.calledCount || 0) + 1;
  entry.updatedAt = new Date().toISOString();
  db.persist();

  const chamberNum = entry.chamberNumber || '101';
  const announcementText = `Recall: Token ${entry.tokenNumber}, please proceed to ${doc?.fullName || entry.doctorName}, Chamber ${chamberNum}`;

  realtimeHub.broadcast('QUEUE_PATIENT_RECALLED', {
    tokenNumber: entry.tokenNumber,
    queueId: entry.id,
    patientName: entry.patientName,
    doctorId: doc?.id || entry.doctorId,
    doctorName: doc?.fullName || entry.doctorName,
    chamberNumber: chamberNum,
    announcementText,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `Token ${entry.tokenNumber} recalled`,
    data: { entry, announcementText }
  });
});

// Start consultation
router.post('/queue/:id/start-consult', authenticate, (req: AuthRequest, res: Response): any => {
  const doc = resolveDoctor(req);
  const entry = (db.raw.queueEntries || []).find(q => q.id === req.params.id);
  if (!entry) return res.status(404).json({ success: false, message: 'Queue token not found' });

  entry.status = 'IN_CONSULTATION';
  entry.updatedAt = new Date().toISOString();

  // Find or create consultation
  if (!db.raw.consultations) db.raw.consultations = [];
  let consult = db.raw.consultations.find(c => c.queueEntryId === entry.id && c.status !== 'CANCELLED');

  if (!consult) {
    const patient = db.getPatientById(entry.patientId || '');
    const consultNum = 'CNS-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    consult = {
      id: 'cns_' + Math.random().toString(36).substr(2, 9),
      consultationNumber: consultNum,
      patientId: entry.patientId || 'pat_unknown',
      patientName: entry.patientName,
      patientAge: patient?.age || 35,
      patientGender: patient?.gender || 'OTHER',
      patientPhone: patient?.phone || '',
      doctorId: doc?.id || entry.doctorId || 'doc_unknown',
      doctorName: doc?.fullName || entry.doctorName || 'Attending Doctor',
      chamberNumber: entry.chamberNumber || '101',
      queueEntryId: entry.id,
      branchId: entry.branchId || 'br_pch_main',
      organizationId: entry.organizationId || 'org_pch',
      status: 'IN_PROGRESS',
      chiefComplaint: '',
      historyOfPresentIllness: '',
      examination: '',
      vitals: {
        bpSystolic: 120,
        bpDiastolic: 80,
        pulse: 72,
        temperature: 98.6,
        respiratoryRate: 16,
        spo2: 99
      },
      assessment: '',
      diagnosis: {
        primary: '',
        secondary: []
      },
      treatmentPlan: '',
      followUpRequired: false,
      testOrderIds: [],
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.raw.consultations.push(consult);
  }

  db.persist();

  realtimeHub.broadcast('CONSULTATION_STARTED', {
    consultationId: consult.id,
    tokenNumber: entry.tokenNumber,
    queueId: entry.id,
    patientName: entry.patientName,
    doctorName: consult.doctorName,
    chamberNumber: consult.chamberNumber
  });

  return res.json({
    success: true,
    message: 'Consultation started',
    data: { entry, consultation: consult }
  });
});

// Skip token with mandatory reason
router.post('/queue/:id/skip', authenticate, (req: AuthRequest, res: Response): any => {
  const { reason, notes } = req.body;
  const entry = (db.raw.queueEntries || []).find(q => q.id === req.params.id);
  if (!entry) return res.status(404).json({ success: false, message: 'Queue token not found' });

  entry.status = 'SKIPPED';
  entry.updatedAt = new Date().toISOString();
  db.persist();

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'DOCTOR_SKIP_TOKEN',
    'QueueEntry',
    entry.id,
    null,
    { reason: reason || 'Patient not present', notes }
  );

  realtimeHub.broadcast('QUEUE_PATIENT_SKIPPED', {
    queueId: entry.id,
    tokenNumber: entry.tokenNumber,
    patientName: entry.patientName,
    reason: reason || 'Not present when called'
  });

  return res.json({
    success: true,
    message: `Token ${entry.tokenNumber} skipped`,
    data: entry
  });
});

// ----------------------------------------------------
// 4. Consultation Workspace & Clinical Documentation
// ----------------------------------------------------
router.get('/consultations/:id', authenticate, (req: AuthRequest, res: Response): any => {
  const consult = (db.raw.consultations || []).find(c => c.id === req.params.id || c.queueEntryId === req.params.id);
  if (!consult) return res.status(404).json({ success: false, message: 'Consultation record not found' });

  const patient = db.getPatientById(consult.patientId);
  const prescription = (db.raw.prescriptions || []).find(p => p.consultationId === consult.id);
  const testOrders = (db.raw.testOrders || []).filter(t => consult.testOrderIds?.includes(t.id) || t.patientId === consult.patientId);

  // Previous consultations for timeline
  const previousConsultations = (db.raw.consultations || []).filter(c => c.patientId === consult.patientId && c.id !== consult.id);

  return res.json({
    success: true,
    data: {
      consultation: consult,
      patient,
      prescription,
      testOrders,
      previousConsultations
    }
  });
});

// Update clinical documentation (Autosave & Save)
router.put('/consultations/:id', authenticate, (req: AuthRequest, res: Response): any => {
  if (!db.raw.consultations) db.raw.consultations = [];
  const consult = db.raw.consultations.find(c => c.id === req.params.id);
  if (!consult) return res.status(404).json({ success: false, message: 'Consultation record not found' });

  const {
    chiefComplaint,
    historyOfPresentIllness,
    examination,
    vitals,
    assessment,
    diagnosis,
    treatmentPlan,
    followUpRequired,
    followUpDate,
    followUpNotes
  } = req.body;

  if (chiefComplaint !== undefined) consult.chiefComplaint = chiefComplaint;
  if (historyOfPresentIllness !== undefined) consult.historyOfPresentIllness = historyOfPresentIllness;
  if (examination !== undefined) consult.examination = examination;
  if (vitals !== undefined) consult.vitals = { ...consult.vitals, ...vitals };
  if (assessment !== undefined) consult.assessment = assessment;
  if (diagnosis !== undefined) consult.diagnosis = { ...consult.diagnosis, ...diagnosis };
  if (treatmentPlan !== undefined) consult.treatmentPlan = treatmentPlan;
  if (followUpRequired !== undefined) consult.followUpRequired = Boolean(followUpRequired);
  if (followUpDate !== undefined) consult.followUpDate = followUpDate;
  if (followUpNotes !== undefined) consult.followUpNotes = followUpNotes;

  consult.updatedAt = new Date().toISOString();
  db.persist();

  return res.json({
    success: true,
    message: 'Clinical notes saved successfully',
    data: consult
  });
});

// Create/Update Prescription
router.post('/consultations/:id/prescription', authenticate, (req: AuthRequest, res: Response): any => {
  const consult = (db.raw.consultations || []).find(c => c.id === req.params.id);
  if (!consult) return res.status(404).json({ success: false, message: 'Consultation record not found' });

  const { medicines, clinicalNotes, advice, followUpDate } = req.body;
  if (!medicines || !Array.isArray(medicines)) {
    return res.status(400).json({ success: false, message: 'Prescription must contain an array of medicines' });
  }

  if (!db.raw.prescriptions) db.raw.prescriptions = [];
  let rx = db.raw.prescriptions.find(p => p.consultationId === consult.id);

  const doc = db.raw.doctors.find(d => d.id === consult.doctorId);

  if (!rx) {
    rx = {
      id: 'rx_' + Math.random().toString(36).substr(2, 9),
      prescriptionNumber: 'RX-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      consultationId: consult.id,
      patientId: consult.patientId,
      patientName: consult.patientName,
      patientAge: consult.patientAge,
      patientGender: consult.patientGender,
      doctorId: consult.doctorId,
      doctorName: consult.doctorName,
      doctorQualifications: doc?.qualifications || 'MBBS, FCPS',
      doctorRegNumber: doc?.medicalRegNumber || 'BMDC-12345',
      branchId: consult.branchId,
      organizationId: consult.organizationId,
      date: new Date().toISOString().slice(0, 10),
      medicines: medicines.map((m: any, idx: number) => ({
        id: m.id || 'med_' + (idx + 1),
        medicine: m.medicine,
        dosage: m.dosage || '1 tab',
        frequency: m.frequency || '1+0+1',
        duration: m.duration || '5 days',
        route: m.route || 'Oral',
        instructions: m.instructions || 'After food',
        quantity: m.quantity || '10'
      })),
      clinicalNotes: clinicalNotes || consult.chiefComplaint || '',
      advice: advice || 'Drink plenty of water and rest well.',
      followUpDate: followUpDate || consult.followUpDate,
      createdAt: new Date().toISOString()
    };
    db.raw.prescriptions.push(rx);
    consult.prescriptionId = rx.id;
  } else {
    rx.medicines = medicines;
    rx.clinicalNotes = clinicalNotes || rx.clinicalNotes;
    rx.advice = advice || rx.advice;
    rx.followUpDate = followUpDate || rx.followUpDate;
  }

  db.persist();

  realtimeHub.broadcast('PRESCRIPTION_CREATED', {
    prescriptionId: rx.id,
    prescriptionNumber: rx.prescriptionNumber,
    patientName: rx.patientName,
    doctorName: rx.doctorName
  });

  return res.json({
    success: true,
    message: 'Prescription generated successfully',
    data: rx
  });
});

// Order Lab Tests directly from Consultation
router.post('/consultations/:id/test-orders', authenticate, (req: AuthRequest, res: Response): any => {
  const consult = (db.raw.consultations || []).find(c => c.id === req.params.id);
  if (!consult) return res.status(404).json({ success: false, message: 'Consultation record not found' });

  const { testIds, priority, clinicalIndication, notes } = req.body;
  if (!testIds || !Array.isArray(testIds) || testIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Please select at least one diagnostic test to order' });
  }

  const patient = db.getPatientById(consult.patientId);
  const items: TestOrderItem[] = testIds.map(tid => {
    const tDef = db.raw.diagnosticTests.find(t => t.id === tid);
    return {
      id: 'toi_' + Math.random().toString(36).substr(2, 9),
      testId: tid,
      testName: tDef?.name || 'Diagnostic Investigation',
      testCode: tDef?.code || 'TEST',
      sampleType: tDef?.sampleType || 'Venous Blood',
      price: tDef?.basePrice || 500,
      status: 'SAMPLE_PENDING'
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const orderNumber = 'TO-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);

  const newOrder: TestOrder = {
    id: 'to_' + Math.random().toString(36).substr(2, 9),
    orderNumber,
    patientId: consult.patientId,
    patientName: consult.patientName,
    patientPhone: patient?.phone || consult.patientPhone,
    doctorId: consult.doctorId,
    doctorName: consult.doctorName,
    branchId: consult.branchId,
    organizationId: consult.organizationId,
    items,
    totalAmount,
    priority: priority || 'NORMAL',
    status: 'ORDERED',
    notes: notes || '',
    clinicalIndication: clinicalIndication || consult.diagnosis.primary || '',
    orderedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db.raw.testOrders) db.raw.testOrders = [];
  db.raw.testOrders.unshift(newOrder);

  if (!consult.testOrderIds) consult.testOrderIds = [];
  consult.testOrderIds.push(newOrder.id);
  db.persist();

  // Broadcast realtime event to Lab
  realtimeHub.broadcast('TEST_ORDER_CREATED', {
    orderId: newOrder.id,
    orderNumber: newOrder.orderNumber,
    patientName: newOrder.patientName,
    patientId: newOrder.patientId,
    doctorName: newOrder.doctorName,
    itemCount: items.length,
    priority: newOrder.priority,
    totalAmount: newOrder.totalAmount,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({
    success: true,
    message: `Diagnostic order #${orderNumber} sent to Laboratory`,
    data: newOrder
  });
});

// Complete Consultation
router.post('/consultations/:id/complete', authenticate, (req: AuthRequest, res: Response): any => {
  const consult = (db.raw.consultations || []).find(c => c.id === req.params.id);
  if (!consult) return res.status(404).json({ success: false, message: 'Consultation not found' });

  consult.status = 'COMPLETED';
  consult.completedAt = new Date().toISOString();
  consult.updatedAt = new Date().toISOString();

  // Find queue entry and complete it
  const queueEntry = (db.raw.queueEntries || []).find(q => q.id === consult.queueEntryId);
  if (queueEntry) {
    queueEntry.status = 'COMPLETED';
    queueEntry.completedAt = new Date().toISOString();
    queueEntry.updatedAt = new Date().toISOString();
  }

  // Release chamber
  const doc = db.raw.doctors.find(d => d.id === consult.doctorId);
  if (doc && doc.chamberId) {
    const chamber = db.raw.chambers.find(c => c.id === doc.chamberId);
    if (chamber) {
      chamber.currentQueueToken = null;
      chamber.status = 'AVAILABLE';
    }
  }

  db.persist();

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'DOCTOR_COMPLETE_CONSULTATION',
    'Consultation',
    consult.id,
    null,
    { consultationNumber: consult.consultationNumber, patientName: consult.patientName }
  );

  realtimeHub.broadcast('CONSULTATION_COMPLETED', {
    consultationId: consult.id,
    tokenNumber: queueEntry?.tokenNumber,
    patientName: consult.patientName,
    doctorName: consult.doctorName
  });

  realtimeHub.broadcast('QUEUE_PATIENT_COMPLETED', {
    queueId: queueEntry?.id,
    tokenNumber: queueEntry?.tokenNumber,
    patientName: consult.patientName
  });

  return res.json({
    success: true,
    message: 'Consultation completed successfully. Next patient is now eligible to be called.',
    data: consult
  });
});

export default router;
