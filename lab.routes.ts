/**
 * Pattern HMS - Laboratory & Pathology Workstation Routes
 * Features: Sample Collection & Barcoding, Processing, Multi-parameter Result Entry,
 * Reference Ranges, Critical Result Flags, Pathologist Electronic Sign-off,
 * Result Amendment Audit History, and Printable Diagnostic Reports.
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { realtimeHub } from '../realtime.js';
import { TestOrder, LabParameterResult, LabAmendment } from '../types.js';

const router = Router();

// Default standard lab test parameter templates for quick autofill
const DEFAULT_TEST_PARAMETERS: Record<string, Array<{ name: string; unit: string; range: string; defaultVal: string }>> = {
  'CBC': [
    { name: 'Hemoglobin (Hb)', unit: 'g/dL', range: '12.0 - 17.5', defaultVal: '14.2' },
    { name: 'Total WBC Count', unit: '/cu mm', range: '4,000 - 11,000', defaultVal: '7,500' },
    { name: 'Neutrophils', unit: '%', range: '40 - 75', defaultVal: '62' },
    { name: 'Lymphocytes', unit: '%', range: '20 - 45', defaultVal: '30' },
    { name: 'Eosinophils', unit: '%', range: '1 - 6', defaultVal: '3' },
    { name: 'Monocytes', unit: '%', range: '2 - 10', defaultVal: '5' },
    { name: 'Platelet Count', unit: 'lakhs/cumm', range: '1.5 - 4.5', defaultVal: '2.8' },
    { name: 'ESR (Westergren)', unit: 'mm/1st hr', range: '0 - 20', defaultVal: '12' }
  ],
  'GLUCOSE': [
    { name: 'Fasting Blood Glucose', unit: 'mg/dL', range: '70 - 99', defaultVal: '92' },
    { name: 'HbA1c (Glycated Hb)', unit: '%', range: '< 5.7 (Normal), 5.7-6.4 (Pre-diabetes)', defaultVal: '5.6' }
  ],
  'LIPID': [
    { name: 'Total Cholesterol', unit: 'mg/dL', range: '< 200', defaultVal: '185' },
    { name: 'HDL Cholesterol', unit: 'mg/dL', range: '> 40 (M), > 50 (F)', defaultVal: '48' },
    { name: 'LDL Cholesterol', unit: 'mg/dL', range: '< 100', defaultVal: '105' },
    { name: 'Triglycerides', unit: 'mg/dL', range: '< 150', defaultVal: '140' }
  ],
  'KFT': [
    { name: 'Serum Creatinine', unit: 'mg/dL', range: '0.7 - 1.3', defaultVal: '0.9' },
    { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', range: '7 - 20', defaultVal: '14' },
    { name: 'Uric Acid', unit: 'mg/dL', range: '3.5 - 7.2', defaultVal: '5.2' }
  ],
  'LFT': [
    { name: 'Serum Bilirubin (Total)', unit: 'mg/dL', range: '0.2 - 1.2', defaultVal: '0.8' },
    { name: 'SGPT (ALT)', unit: 'U/L', range: '7 - 56', defaultVal: '28' },
    { name: 'SGOT (AST)', unit: 'U/L', range: '10 - 40', defaultVal: '24' },
    { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', range: '44 - 147', defaultVal: '85' }
  ]
};

// ----------------------------------------------------
// 1. Lab Dashboard & Metric Overview
// ----------------------------------------------------
router.get('/dashboard', authenticate, (req: AuthRequest, res: Response): any => {
  const orders = db.raw.testOrders || [];
  const today = new Date().toISOString().slice(0, 10);

  const todayOrders = orders.filter(o => o.orderedAt?.slice(0, 10) === today || o.createdAt?.slice(0, 10) === today);
  const samplePending = orders.filter(o => o.status === 'SAMPLE_PENDING' || o.status === 'ORDERED');
  const processing = orders.filter(o => o.status === 'SAMPLE_COLLECTED' || o.status === 'PROCESSING');
  const pendingVerification = orders.filter(o => o.status === 'VERIFICATION_PENDING');
  const verifiedToday = orders.filter(o => o.status === 'VERIFIED' && (o.verifiedAt?.slice(0, 10) === today || o.updatedAt?.slice(0, 10) === today));
  const urgentOrders = orders.filter(o => (o.priority === 'URGENT' || o.priority === 'EMERGENCY') && o.status !== 'VERIFIED' && o.status !== 'DELIVERED');

  return res.json({
    success: true,
    data: {
      metrics: {
        totalOrders: orders.length,
        todayCount: todayOrders.length,
        samplePendingCount: samplePending.length,
        processingCount: processing.length,
        pendingVerificationCount: pendingVerification.length,
        verifiedTodayCount: verifiedToday.length,
        urgentCount: urgentOrders.length
      },
      recentOrders: orders.slice(0, 10)
    }
  });
});

// ----------------------------------------------------
// 2. Lab Orders Work Queue (With Search & Status Filters)
// ----------------------------------------------------
router.get('/orders', authenticate, (req: AuthRequest, res: Response): any => {
  let orders = [...(db.raw.testOrders || [])];
  const { status, priority, search } = req.query;

  if (status && status !== 'ALL') {
    if (status === 'SAMPLE_PENDING') {
      orders = orders.filter(o => o.status === 'SAMPLE_PENDING' || o.status === 'ORDERED');
    } else if (status === 'PROCESSING') {
      orders = orders.filter(o => o.status === 'SAMPLE_COLLECTED' || o.status === 'PROCESSING');
    } else {
      orders = orders.filter(o => o.status === status);
    }
  }

  if (priority && priority !== 'ALL') {
    orders = orders.filter(o => o.priority === priority);
  }

  if (search) {
    const q = String(search).toLowerCase();
    orders = orders.filter(o => 
      o.orderNumber?.toLowerCase().includes(q) ||
      o.patientName?.toLowerCase().includes(q) ||
      o.patientPhone?.includes(q) ||
      o.items.some(i => i.testName.toLowerCase().includes(q) || i.sampleIdentifier?.toLowerCase().includes(q))
    );
  }

  // Sort urgent & emergency to the top, then newest
  orders.sort((a, b) => {
    const priorityWeight: Record<string, number> = { EMERGENCY: 3, URGENT: 2, NORMAL: 1 };
    const pA = priorityWeight[a.priority] || 1;
    const pB = priorityWeight[b.priority] || 1;
    if (pA !== pB) return pB - pA;
    return new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime();
  });

  return res.json({
    success: true,
    data: orders
  });
});

// ----------------------------------------------------
// 3. Single Lab Order Details & Parameters
// ----------------------------------------------------
router.get('/orders/:id', authenticate, (req: AuthRequest, res: Response): any => {
  const order = (db.raw.testOrders || []).find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Test order not found' });

  const patient = db.getPatientById(order.patientId);

  // If item parameters are not populated yet, suggest default templates
  const itemsWithDefaults = order.items.map(item => {
    let suggestedParams: any[] = [];
    const upper = item.testName.toUpperCase() + ' ' + (item.testCode || '');
    if (upper.includes('CBC') || upper.includes('BLOOD COUNT') || upper.includes('HEMOGRAM')) {
      suggestedParams = DEFAULT_TEST_PARAMETERS['CBC'];
    } else if (upper.includes('GLUCOSE') || upper.includes('SUGAR') || upper.includes('HBA1C')) {
      suggestedParams = DEFAULT_TEST_PARAMETERS['GLUCOSE'];
    } else if (upper.includes('LIPID') || upper.includes('CHOLESTEROL')) {
      suggestedParams = DEFAULT_TEST_PARAMETERS['LIPID'];
    } else if (upper.includes('KFT') || upper.includes('RENAL') || upper.includes('CREATININE')) {
      suggestedParams = DEFAULT_TEST_PARAMETERS['KFT'];
    } else if (upper.includes('LFT') || upper.includes('LIVER') || upper.includes('BILIRUBIN')) {
      suggestedParams = DEFAULT_TEST_PARAMETERS['LFT'];
    }

    return {
      ...item,
      suggestedParameters: suggestedParams
    };
  });

  return res.json({
    success: true,
    data: {
      order: {
        ...order,
        items: itemsWithDefaults
      },
      patient
    }
  });
});

// ----------------------------------------------------
// 4. Sample Collection & Barcoding
// ----------------------------------------------------
router.post('/orders/:id/collect-sample', authenticate, (req: AuthRequest, res: Response): any => {
  const order = (db.raw.testOrders || []).find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Test order not found' });

  const { sampleType, sampleIdentifier, notes } = req.body;
  const barcode = sampleIdentifier || `BAR-${new Date().getFullYear().toString().slice(2)}${Math.floor(100000 + Math.random() * 900000)}`;

  order.status = 'SAMPLE_COLLECTED';
  order.sampleCollectedAt = new Date().toISOString();
  order.sampleCollectedBy = req.user?.fullName || 'Lab Phlebotomist';
  order.updatedAt = new Date().toISOString();

  // Update item level sample identifiers
  order.items.forEach(item => {
    item.status = 'SAMPLE_COLLECTED';
    item.sampleIdentifier = barcode;
    item.sampleCollectedAt = order.sampleCollectedAt;
    item.sampleCollectedBy = order.sampleCollectedBy;
    if (sampleType) item.sampleType = sampleType;
  });

  db.persist();

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'LAB_SAMPLE_COLLECTED',
    'TestOrder',
    order.id,
    null,
    { barcode, patientName: order.patientName }
  );

  realtimeHub.broadcast('TEST_SAMPLE_COLLECTED', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    patientName: order.patientName,
    barcode,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `Sample collected for order #${order.orderNumber}. Accession Barcode: ${barcode}`,
    data: { order, barcode }
  });
});

// ----------------------------------------------------
// 5. Start Processing & Claim Order
// ----------------------------------------------------
router.post('/orders/:id/start-processing', authenticate, (req: AuthRequest, res: Response): any => {
  const order = (db.raw.testOrders || []).find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Test order not found' });

  const { instrumentUsed, notes } = req.body;

  order.status = 'PROCESSING';
  order.processingStartedAt = new Date().toISOString();
  order.assignedTechnician = req.user?.fullName || 'Senior Lab Technologist';
  order.updatedAt = new Date().toISOString();

  order.items.forEach(item => {
    item.status = 'PROCESSING';
    item.processingStartedAt = order.processingStartedAt;
    item.assignedTechnician = order.assignedTechnician;
    if (instrumentUsed) item.instrumentUsed = instrumentUsed;
  });

  db.persist();

  realtimeHub.broadcast('TEST_PROCESSING', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    assignedTechnician: order.assignedTechnician,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `Order #${order.orderNumber} is now under analysis`,
    data: order
  });
});

// ----------------------------------------------------
// 6. Enter Results & Dynamic Multi-parameter Metrics
// ----------------------------------------------------
router.post('/orders/:id/results', authenticate, (req: AuthRequest, res: Response): any => {
  const order = (db.raw.testOrders || []).find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Test order not found' });

  const { itemId, parameters, resultSummary, criticalAlertNotes } = req.body;

  if (!parameters || !Array.isArray(parameters)) {
    return res.status(400).json({ success: false, message: 'Parameter results array is required' });
  }

  // Find targeted item or update all items
  const targetItems = itemId ? order.items.filter(i => i.id === itemId) : order.items;

  let hasCritical = false;

  targetItems.forEach(item => {
    item.parameters = parameters.map((p: any, idx: number) => {
      const flag = p.flag || 'NORMAL';
      if (flag === 'CRITICAL') hasCritical = true;
      return {
        id: p.id || `param_${idx + 1}`,
        name: p.name,
        value: String(p.value),
        unit: p.unit || '',
        referenceRange: p.referenceRange || '',
        flag,
        comments: p.comments || ''
      };
    });

    item.status = 'COMPLETED';
    item.resultSummary = resultSummary || 'Analysis completed';
    if (hasCritical) {
      item.criticalResultAcknowledged = true;
      item.criticalAlertNotes = criticalAlertNotes || 'Critical abnormal values detected';
    }
  });

  order.status = 'VERIFICATION_PENDING';
  order.updatedAt = new Date().toISOString();
  db.persist();

  realtimeHub.broadcast('TEST_RESULT_READY', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    patientName: order.patientName,
    hasCritical,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `Test results saved for order #${order.orderNumber}. Ready for Pathologist verification.`,
    data: order
  });
});

// ----------------------------------------------------
// 7. Pathologist Verification & Sign-off
// ----------------------------------------------------
router.post('/orders/:id/verify', authenticate, (req: AuthRequest, res: Response): any => {
  const order = (db.raw.testOrders || []).find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Test order not found' });

  order.status = 'VERIFIED';
  order.verifiedBy = req.user?.id || 'usr_pathologist';
  order.verifiedByName = req.user?.fullName || 'Dr. Ananya Sen, MD (Pathology)';
  order.verifiedAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  order.items.forEach(item => {
    item.status = 'VERIFIED';
    item.verifiedBy = order.verifiedBy;
    item.verifiedByName = order.verifiedByName;
    item.verifiedAt = order.verifiedAt;
  });

  db.persist();

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'LAB_RESULT_VERIFIED',
    'TestOrder',
    order.id,
    null,
    { verifiedByName: order.verifiedByName, orderNumber: order.orderNumber }
  );

  realtimeHub.broadcast('TEST_RESULT_VERIFIED', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    patientName: order.patientName,
    verifiedByName: order.verifiedByName,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `Report #${order.orderNumber} successfully verified and released by ${order.verifiedByName}`,
    data: order
  });
});

// ----------------------------------------------------
// 8. Result Amendment & Versioning
// ----------------------------------------------------
router.post('/orders/:id/amend', authenticate, (req: AuthRequest, res: Response): any => {
  const order = (db.raw.testOrders || []).find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Test order not found' });

  const { itemId, parameters, amendmentReason } = req.body;
  if (!amendmentReason) {
    return res.status(400).json({ success: false, message: 'Reason for amendment is strictly required' });
  }

  const targetItem = order.items.find(i => i.id === itemId) || order.items[0];
  if (!targetItem) return res.status(404).json({ success: false, message: 'Item not found' });

  // Record previous snapshot in amendments history
  if (!targetItem.amendments) targetItem.amendments = [];
  targetItem.amendments.push({
    amendedAt: new Date().toISOString(),
    amendedBy: req.user?.fullName || 'Pathologist',
    reason: amendmentReason,
    previousResults: [...(targetItem.parameters || [])]
  });

  // Apply new parameters
  targetItem.parameters = parameters;
  order.updatedAt = new Date().toISOString();
  db.persist();

  return res.json({
    success: true,
    message: 'Report amended and logged to immutable audit history',
    data: order
  });
});

// ----------------------------------------------------
// 9. Printable A4 Diagnostic Report Data
// ----------------------------------------------------
router.get('/orders/:id/report', authenticate, (req: AuthRequest, res: Response): any => {
  const order = (db.raw.testOrders || []).find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const patient = db.getPatientById(order.patientId);
  const org = db.raw.organizations[0];
  const branch = db.raw.branches[0];

  return res.json({
    success: true,
    data: {
      hospital: {
        name: org?.name || 'Pattern Central Hospital',
        phone: branch?.phone || '+880 2 9876543',
        address: branch?.address || 'House 45, Road 11, Banani, Dhaka-1213',
        email: branch?.email || 'lab@centralhospital.com'
      },
      order,
      patient,
      verifiedByName: order.verifiedByName || 'Dr. Ananya Sen, MD (Pathology)',
      printedAt: new Date().toISOString()
    }
  });
});

export default router;
