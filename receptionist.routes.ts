/**
 * Pattern HMS - Receptionist & Front-Desk Operations Routes
 * Covers: Patient Admissions, Appointments & Scheduling, Token Queue System,
 * Sales Agent Commission Ledger, Invoicing & Receipts, Bed Allocations, and Shifts.
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';
import { QueuePriority, PaymentMethod } from '../types.js';

const router = Router();

// ====================================================
// 1. Receptionist Dashboard KPIs
// ====================================================
router.get('/kpis', authenticate, requirePermission('reception.view'), (req: AuthRequest, res: Response) => {
  try {
    const branchId = (req.query.branchId as string) || req.user?.branchId || undefined;
    const orgId = (req.query.orgId as string) || req.user?.organizationId || undefined;
    const kpis = db.getReceptionistKPIs(branchId, orgId);
    res.json({ success: true, data: kpis });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ====================================================
// 2. Patient Registration & Master Records
// ====================================================
router.get('/patients', authenticate, requirePermission('patient.view'), (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.query as string | undefined;
    const branchId = (req.query.branchId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.branchId : undefined);
    const orgId = (req.query.orgId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.organizationId : undefined);
    const status = req.query.status as string | undefined;

    const patients = db.getPatients({ query, branchId, organizationId: orgId, status });
    res.json({ success: true, data: patients });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/patients/check-duplicate', authenticate, requirePermission('patient.view'), (req: AuthRequest, res: Response): any => {
  try {
    const { phone, fullName, dob } = req.body;
    if (!phone || !fullName) {
      return res.status(400).json({ success: false, message: 'Phone and full name are required for duplicate checking.' });
    }
    const duplicates = db.findDuplicatePatients(phone, fullName, dob);
    return res.json({ success: true, isDuplicate: duplicates.length > 0, duplicates });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/patients/:id', authenticate, requirePermission('patient.view'), (req: AuthRequest, res: Response): any => {
  try {
    const patient = db.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    return res.json({ success: true, data: patient });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/patients', authenticate, requirePermission('patient.create'), (req: AuthRequest, res: Response): any => {
  try {
    const {
      fullName,
      phone,
      email,
      gender,
      dob,
      age,
      bloodGroup,
      address,
      emergencyContact,
      medicalHistory,
      organizationId,
      branchId
    } = req.body;

    if (!fullName || !phone || !gender || age === undefined) {
      return res.status(400).json({ success: false, message: 'Full name, phone, gender, and age are required.' });
    }

    const org = organizationId || req.user?.organizationId || db.raw.organizations[0]?.id;
    const brn = branchId || req.user?.branchId || db.raw.branches[0]?.id;

    const patient = db.createPatient(
      {
        fullName,
        phone,
        email: email || '',
        gender,
        dob: dob || '',
        age: Number(age),
        bloodGroup: bloodGroup || 'UNKNOWN',
        address: address || { street: '', city: 'Dhaka', state: 'Dhaka', postalCode: '1205', country: 'Bangladesh' },
        emergencyContact: emergencyContact || { name: '', phone: '', relationship: '' },
        medicalHistory: medicalHistory || { allergies: [], chronicDiseases: [], previousSurgeries: [], currentMedications: [] },
        status: 'ACTIVE',
        organizationId: org,
        branchId: brn,
        registeredByUserId: req.user!.id
      },
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );

    return res.status(201).json({ success: true, message: 'Patient registered successfully', data: patient });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/patients/:id', authenticate, requirePermission('patient.edit'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.updatePatient(
      req.params.id,
      req.body,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Patient details updated', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/patients/:id', authenticate, requirePermission('patient.delete'), (req: AuthRequest, res: Response): any => {
  try {
    const success = db.deletePatient(
      req.params.id,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    if (!success) return res.status(404).json({ success: false, message: 'Patient not found' });
    return res.json({ success: true, message: 'Patient marked as deleted' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ====================================================
// 3. Appointments & Scheduling
// ====================================================
router.get('/appointments', authenticate, requirePermission('appointment.view'), (req: AuthRequest, res: Response) => {
  try {
    const date = req.query.date as string | undefined;
    const doctorId = req.query.doctorId as string | undefined;
    const patientId = req.query.patientId as string | undefined;
    const status = req.query.status as string | undefined;
    const branchId = (req.query.branchId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.branchId : undefined);
    const orgId = (req.query.orgId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.organizationId : undefined);

    const appointments = db.getAppointments({ date, doctorId, patientId, status, branchId, organizationId: orgId });
    res.json({ success: true, data: appointments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/appointments', authenticate, requirePermission('appointment.create'), (req: AuthRequest, res: Response): any => {
  try {
    const { patientId, doctorId, date, timeSlot, type, fee, notes, branchId, organizationId } = req.body;
    if (!patientId || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Patient, doctor, date, and time slot are required.' });
    }

    const patient = db.getPatientById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const doctor = db.raw.doctors.find(d => d.id === doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const chamber = db.raw.chambers.find(c => c.id === doctor.chamberId);
    const org = organizationId || doctor.organizationId;
    const brn = branchId || doctor.branchId;

    const apt = db.createAppointment(
      {
        patientId: patient.id,
        patientName: patient.fullName,
        patientPhone: patient.phone,
        doctorId: doctor.id,
        doctorName: doctor.fullName,
        chamberName: chamber?.name || 'Doctor Chamber',
        chamberNumber: chamber?.number || '101',
        branchId: brn,
        organizationId: org,
        date,
        timeSlot,
        type: type || 'CONSULTATION',
        status: 'SCHEDULED',
        fee: fee !== undefined ? Number(fee) : doctor.consultationFee,
        notes: notes || '',
        createdByUserId: req.user!.id
      },
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );

    return res.status(201).json({ success: true, message: 'Appointment booked successfully', data: apt });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/appointments/:id', authenticate, requirePermission('appointment.edit'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.updateAppointment(
      req.params.id,
      req.body,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Appointment updated', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/appointments/:id/checkin', authenticate, requirePermission('appointment.checkin'), (req: AuthRequest, res: Response): any => {
  try {
    const result = db.checkInAppointment(
      req.params.id,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({
      success: true,
      message: `Patient checked in. Queue token #${result.queueEntry.tokenNumber} issued.`,
      data: result
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ====================================================
// 4. Token & Queue Management (Voice Audio Support)
// ====================================================
router.get('/queue', authenticate, requirePermission('queue.view'), (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.query.doctorId as string | undefined;
    const chamberNumber = req.query.chamberNumber as string | undefined;
    const status = req.query.status as string | undefined;
    const branchId = (req.query.branchId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.branchId : undefined);
    const orgId = (req.query.orgId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.organizationId : undefined);
    const date = req.query.date as string | undefined;

    const list = db.getQueueEntries({ doctorId, chamberNumber, status, branchId, organizationId: orgId, date });
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/queue/walk-in', authenticate, requirePermission('queue.issue_token'), (req: AuthRequest, res: Response): any => {
  try {
    const { patientId, doctorId, priority, notes, branchId, organizationId } = req.body;
    if (!patientId || !doctorId) {
      return res.status(400).json({ success: false, message: 'Patient and doctor are required.' });
    }

    const doctor = db.raw.doctors.find(d => d.id === doctorId);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const entry = db.createQueueEntry(
      {
        patientId,
        doctorId,
        branchId: branchId || doctor.branchId,
        organizationId: organizationId || doctor.organizationId,
        priority: (priority as QueuePriority) || 'NORMAL',
        visitType: 'WALK_IN',
        notes
      },
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );

    return res.status(201).json({
      success: true,
      message: `Token #${entry.tokenNumber} issued successfully`,
      data: entry
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/queue/:id/call', authenticate, requirePermission('queue.call_token'), (req: AuthRequest, res: Response): any => {
  try {
    const result = db.callQueueEntry(
      req.params.id,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({
      success: true,
      message: `Token ${result.entry.tokenNumber} called to Chamber ${result.entry.chamberNumber}`,
      data: result.entry,
      announcementText: result.announcementText
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/queue/:id/recall', authenticate, requirePermission('queue.call_token'), (req: AuthRequest, res: Response): any => {
  try {
    const result = db.recallQueueEntry(
      req.params.id,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({
      success: true,
      message: `Token ${result.entry.tokenNumber} re-called`,
      data: result.entry,
      announcementText: result.announcementText
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/queue/:id/consult', authenticate, requirePermission('queue.call_token'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.startQueueConsultation(
      req.params.id,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Patient entered consultation chamber', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/queue/:id/complete', authenticate, requirePermission('queue.call_token'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.completeQueueEntry(
      req.params.id,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Consultation completed', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/queue/:id/skip', authenticate, requirePermission('queue.call_token'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.skipQueueEntry(
      req.params.id,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Token skipped', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/queue/:id/hold', authenticate, requirePermission('queue.call_token'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.holdQueueEntry(
      req.params.id,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Token placed on hold', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/queue/:id/transfer', authenticate, requirePermission('queue.transfer_token'), (req: AuthRequest, res: Response): any => {
  try {
    const { targetDoctorId, reason } = req.body;
    if (!targetDoctorId || !reason) {
      return res.status(400).json({ success: false, message: 'Target doctor and reason for transfer are required.' });
    }
    const updated = db.transferQueueEntry(
      req.params.id,
      targetDoctorId,
      reason,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Patient queue entry transferred successfully', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ====================================================
// 5. Sales Agents & Real-Time Commission Ledger
// ====================================================
router.get('/sales-agents', authenticate, requirePermission('sales_agent.view'), (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.query as string | undefined;
    const status = req.query.status as string | undefined;
    const orgId = (req.query.orgId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.organizationId : undefined);

    const agents = db.getSalesAgents({ query, status, organizationId: orgId });
    res.json({ success: true, data: agents });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/sales-agents/:id', authenticate, requirePermission('sales_agent.view'), (req: AuthRequest, res: Response): any => {
  try {
    const agent = db.getSalesAgentById(req.params.id);
    if (!agent) return res.status(404).json({ success: false, message: 'Sales agent not found' });
    const commissions = db.getSalesAgentCommissions({ salesAgentId: agent.id });
    const ledger = db.getSalesAgentLedger(agent.id);
    return res.json({ success: true, data: { ...agent, commissions, ledger } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/sales-agents', authenticate, requirePermission('sales_agent.create'), (req: AuthRequest, res: Response): any => {
  try {
    const { fullName, phone, email, nidNumber, address, commissionPercentage, status, organizationId } = req.body;
    if (!fullName || !phone || commissionPercentage === undefined) {
      return res.status(400).json({ success: false, message: 'Full name, phone, and commission percentage are required.' });
    }

    const org = organizationId || req.user?.organizationId || db.raw.organizations[0]?.id;
    const agent = db.createSalesAgent(
      {
        fullName,
        phone,
        email: email || '',
        nidNumber: nidNumber || '',
        address: address || 'Dhaka, Bangladesh',
        commissionPercentage: Number(commissionPercentage),
        status: status || 'ACTIVE',
        organizationId: org,
        branchId: req.user?.branchId || db.raw.branches[0]?.id || 'branch-1'
      },
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );

    return res.status(201).json({ success: true, message: 'Sales agent registered successfully', data: agent });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/sales-agents/:id', authenticate, requirePermission('sales_agent.edit'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.updateSalesAgent(
      req.params.id,
      req.body,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Sales agent updated', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/sales-agents/:id/commissions', authenticate, requirePermission('sales_agent.view_commission'), (req: AuthRequest, res: Response) => {
  try {
    const commissions = db.getSalesAgentCommissions({ salesAgentId: req.params.id });
    res.json({ success: true, data: commissions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/sales-agents/:id/ledger', authenticate, requirePermission('sales_agent.view_commission'), (req: AuthRequest, res: Response) => {
  try {
    const ledger = db.getSalesAgentLedger(req.params.id);
    res.json({ success: true, data: ledger });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/sales-agents/:id/payout', authenticate, requirePermission('sales_agent.payout'), (req: AuthRequest, res: Response): any => {
  try {
    const { amount, reference, notes } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive payout amount is required.' });
    }

    const ledgerEntry = db.recordCommissionPayout(
      req.params.id,
      Number(amount),
      reference || 'PO-' + Date.now(),
      notes || 'Commission disbursement approved by front-desk cashier',
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );

    return res.json({ success: true, message: `Commission payout of ৳${amount} completed`, data: ledgerEntry });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ====================================================
// 6. Billing, Invoices & Receipt Generation
// ====================================================
router.get('/billing/invoices', authenticate, requirePermission('billing.view'), (req: AuthRequest, res: Response) => {
  try {
    const query = req.query.query as string | undefined;
    const patientId = req.query.patientId as string | undefined;
    const status = req.query.status as string | undefined;
    const salesAgentId = req.query.salesAgentId as string | undefined;
    const branchId = (req.query.branchId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.branchId : undefined);
    const orgId = (req.query.orgId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.organizationId : undefined);

    const invoices = db.getInvoices({ query, patientId, status, salesAgentId, branchId, organizationId: orgId });
    res.json({ success: true, data: invoices });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/billing/invoices/:id', authenticate, requirePermission('billing.view'), (req: AuthRequest, res: Response): any => {
  try {
    const inv = db.getInvoiceById(req.params.id);
    if (!inv) return res.status(404).json({ success: false, message: 'Invoice not found' });
    const payments = (db.raw.payments || []).filter(p => p.invoiceId === inv.id);
    return res.json({ success: true, data: { ...inv, payments } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/billing/invoices', authenticate, requirePermission('billing.create'), (req: AuthRequest, res: Response): any => {
  try {
    const { patientId, items, discountType, discountValue, salesAgentId, initialPayment, branchId, organizationId } = req.body;
    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one billable item are required.' });
    }

    const patient = db.getPatientById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const org = organizationId || patient.organizationId;
    const brn = branchId || patient.branchId;

    const result = db.createInvoice(
      {
        patientId,
        organizationId: org,
        branchId: brn,
        items,
        discountType: discountType || 'FIXED',
        discountValue: Number(discountValue) || 0,
        salesAgentId: salesAgentId || null,
        initialPayment: initialPayment && Number(initialPayment.amount) > 0 ? {
          amount: Number(initialPayment.amount),
          method: initialPayment.method || 'CASH',
          transactionReference: initialPayment.transactionReference || 'INIT-TXN',
          notes: initialPayment.notes
        } : undefined
      },
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );

    return res.status(201).json({
      success: true,
      message: `Invoice ${result.invoice.invoiceNumber} created successfully`,
      data: result
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/billing/invoices/:id/cancel', authenticate, requirePermission('billing.edit'), (req: AuthRequest, res: Response): any => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Reason for cancellation is required.' });
    const cancelled = db.cancelInvoice(
      req.params.id,
      reason,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: `Invoice ${cancelled.invoiceNumber} cancelled`, data: cancelled });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/billing/payments', authenticate, requirePermission('payment.collect'), (req: AuthRequest, res: Response): any => {
  try {
    const { invoiceId, amount, method, transactionReference, notes } = req.body;
    if (!invoiceId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice ID and valid positive amount are required.' });
    }

    const payment = db.createPayment(
      {
        invoiceId,
        amount: Number(amount),
        method: method || 'CASH',
        transactionReference: transactionReference || 'REC-' + Date.now(),
        notes
      },
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );

    return res.status(201).json({
      success: true,
      message: `Payment of ৳${payment.amount} collected. Receipt #${payment.receiptNumber} generated.`,
      data: payment
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ====================================================
// 7. Diagnostic Test Ordering
// ====================================================
router.get('/test-orders', authenticate, requirePermission('diagnostic.view'), (req: AuthRequest, res: Response) => {
  try {
    const patientId = req.query.patientId as string | undefined;
    const status = req.query.status as string | undefined;
    const branchId = (req.query.branchId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.branchId : undefined);
    const orgId = (req.query.orgId as string) || (req.user?.roleCode !== 'SUPER_ADMIN' ? req.user?.organizationId : undefined);

    const orders = db.getTestOrders({ patientId, status, branchId, organizationId: orgId });
    res.json({ success: true, data: orders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/test-orders', authenticate, requirePermission('diagnostic.create'), (req: AuthRequest, res: Response): any => {
  try {
    const { patientId, doctorId, testIds, priority, invoiceId, notes, branchId, organizationId } = req.body;
    if (!patientId || !testIds || !Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one diagnostic test are required.' });
    }

    const patient = db.getPatientById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const org = organizationId || patient.organizationId;
    const brn = branchId || patient.branchId;

    const order = db.createTestOrder(
      {
        patientId,
        doctorId: doctorId || null,
        branchId: brn,
        organizationId: org,
        testIds,
        priority: priority || 'NORMAL',
        invoiceId: invoiceId || null,
        notes
      },
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );

    return res.status(201).json({
      success: true,
      message: `Diagnostic order #${order.orderNumber} created`,
      data: order
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/test-orders/:id/status', authenticate, requirePermission('diagnostic.edit'), (req: AuthRequest, res: Response): any => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });
    const updated = db.updateTestOrderStatus(
      req.params.id,
      status,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Test order status updated', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ====================================================
// 8. Front Desk Bed Allocations
// ====================================================
router.post('/beds/assign', authenticate, requirePermission('bed.assign'), (req: AuthRequest, res: Response): any => {
  try {
    const { bedId, patientId } = req.body;
    if (!bedId || !patientId) return res.status(400).json({ success: false, message: 'Bed and patient IDs are required.' });
    const bed = db.assignBed(
      bedId,
      patientId,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: `Bed ${bed.bedNumber} allocated to patient`, data: bed });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/beds/release', authenticate, requirePermission('bed.assign'), (req: AuthRequest, res: Response): any => {
  try {
    const { bedId } = req.body;
    if (!bedId) return res.status(400).json({ success: false, message: 'Bed ID is required.' });
    const bed = db.releaseBed(
      bedId,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: `Bed ${bed.bedNumber} released and flagged for cleaning`, data: bed });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/beds/clean', authenticate, requirePermission('bed.assign'), (req: AuthRequest, res: Response): any => {
  try {
    const { bedId } = req.body;
    if (!bedId) return res.status(400).json({ success: false, message: 'Bed ID is required.' });
    const bed = db.completeBedCleaning(
      bedId,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: `Bed ${bed.bedNumber} marked ready and available`, data: bed });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ====================================================
// 9. Shifts & Daily Cash Register Settlement
// ====================================================
router.get('/shifts/current', authenticate, requirePermission('shift.view'), (req: AuthRequest, res: Response) => {
  try {
    const branchId = req.user?.branchId || db.raw.branches[0]?.id;
    const shift = db.getCurrentShift(req.user!.id, branchId);
    res.json({ success: true, data: shift || null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/shifts/start', authenticate, requirePermission('shift.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const { openingCash } = req.body;
    const branchId = req.user?.branchId || db.raw.branches[0]?.id;
    const orgId = req.user?.organizationId || db.raw.organizations[0]?.id;

    const shift = db.startShift(
      req.user!.id,
      Number(openingCash) || 0,
      branchId,
      orgId,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.status(201).json({ success: true, message: 'Shift started successfully', data: shift });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.post('/shifts/close', authenticate, requirePermission('shift.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const { shiftId, actualCash, discrepancyReason } = req.body;
    if (!shiftId || actualCash === undefined) {
      return res.status(400).json({ success: false, message: 'Shift ID and actual cash counted are required.' });
    }

    const closed = db.closeShift(
      shiftId,
      Number(actualCash),
      discrepancyReason,
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode, name: req.user!.fullName }
    );
    return res.json({ success: true, message: 'Shift closed and balanced', data: closed });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.get('/daily-collection', authenticate, requirePermission('billing.view'), (req: AuthRequest, res: Response) => {
  try {
    const branchId = (req.query.branchId as string) || req.user?.branchId || undefined;
    const date = req.query.date as string | undefined;
    const summary = db.getDailyCollectionSummary(branchId, date);
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
