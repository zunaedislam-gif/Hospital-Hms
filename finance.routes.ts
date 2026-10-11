/**
 * Pattern HMS - Finance & Accounts Management Routes
 * Features: Multi-method Payment Collection, Balance & Overpayment Guards,
 * Authorized Refund Workflows, Operational Expense Tracking & Approval,
 * Sales Agent Commissions Disbursement, Daily Cash Register Reconciliation,
 * and Real-time Financial Reporting.
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { realtimeHub } from '../realtime.js';
import { Payment, Refund, Expense, CashClosing } from '../types.js';

const router = Router();

// ----------------------------------------------------
// 1. Financial Dashboard & Revenue Analytics
// ----------------------------------------------------
router.get('/dashboard', authenticate, (req: AuthRequest, res: Response): any => {
  const branchId = req.query.branchId as string;
  let payments = db.raw.payments || [];
  let invoices = db.raw.invoices || [];
  let refunds = db.raw.refunds || [];
  let expenses = db.raw.expenses || [];
  let commissions = db.raw.salesAgentCommissions || [];

  if (branchId) {
    payments = payments.filter(p => p.branchId === branchId);
    invoices = invoices.filter(i => i.branchId === branchId);
    refunds = refunds.filter(r => r.branchId === branchId);
    expenses = expenses.filter(e => e.branchId === branchId);
    commissions = commissions.filter(c => c.branchId === branchId);
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayPayments = payments.filter(p => p.createdAt?.slice(0, 10) === today);
  const todayExpenses = expenses.filter(e => e.createdAt?.slice(0, 10) === today || e.date === today);
  const todayRefunds = refunds.filter(r => r.createdAt?.slice(0, 10) === today);

  // Collections by method today
  const cashToday = todayPayments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
  const cardToday = todayPayments.filter(p => p.method === 'CARD').reduce((sum, p) => sum + p.amount, 0);
  const mobileToday = todayPayments.filter(p => p.method === 'MOBILE').reduce((sum, p) => sum + p.amount, 0);
  const bankToday = todayPayments.filter(p => p.method === 'BANK').reduce((sum, p) => sum + p.amount, 0);
  const totalCollectionsToday = cashToday + cardToday + mobileToday + bankToday;

  // All time collections
  const allTimeRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const allTimeExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const allTimeRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);
  const netIncome = allTimeRevenue - allTimeExpenses - allTimeRefunds;

  // Outstanding dues
  const outstandingDue = invoices.reduce((sum, i) => sum + (i.dueAmount || 0), 0);
  const pendingInvoicesCount = invoices.filter(i => i.status === 'ISSUED' || i.status === 'PARTIALLY_PAID').length;

  // Commissions summary
  const pendingCommissions = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.commissionAmount, 0);
  const paidCommissions = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.commissionAmount, 0);

  return res.json({
    success: true,
    data: {
      today: {
        totalRevenue: totalCollectionsToday,
        cash: cashToday,
        card: cardToday,
        mobile: mobileToday,
        bank: bankToday,
        expenses: todayExpenses.reduce((sum, e) => sum + e.amount, 0),
        refunds: todayRefunds.reduce((sum, r) => sum + r.amount, 0),
        net: totalCollectionsToday - todayExpenses.reduce((sum, e) => sum + e.amount, 0) - todayRefunds.reduce((sum, r) => sum + r.amount, 0)
      },
      overview: {
        allTimeRevenue,
        allTimeExpenses,
        allTimeRefunds,
        netIncome,
        outstandingDue,
        pendingInvoicesCount,
        pendingCommissions,
        paidCommissions
      }
    }
  });
});

// ----------------------------------------------------
// 2. Invoices Ledger (With Search & Status Filters)
// ----------------------------------------------------
router.get('/invoices', authenticate, (req: AuthRequest, res: Response): any => {
  let invoices = [...(db.raw.invoices || [])];
  const { status, search, dateFrom, dateTo } = req.query;

  if (status && status !== 'ALL') {
    invoices = invoices.filter(i => i.status === status);
  }

  if (search) {
    const q = String(search).toLowerCase();
    invoices = invoices.filter(i => 
      i.invoiceNumber?.toLowerCase().includes(q) ||
      i.patientName?.toLowerCase().includes(q) ||
      i.patientPhone?.includes(q)
    );
  }

  if (dateFrom) {
    invoices = invoices.filter(i => i.createdAt >= String(dateFrom));
  }
  if (dateTo) {
    invoices = invoices.filter(i => i.createdAt <= String(dateTo) + 'T23:59:59');
  }

  invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    success: true,
    data: invoices
  });
});

// ----------------------------------------------------
// 3. Payment Collection & Overpayment Protection
// ----------------------------------------------------
router.post('/payments', authenticate, (req: AuthRequest, res: Response): any => {
  const { invoiceId, amount, method, reference, notes } = req.body;

  if (!invoiceId || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Valid invoiceId and positive amount are required' });
  }

  const invoice = (db.raw.invoices || []).find(i => i.id === invoiceId);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  // Guard against overpayment
  if (amount > invoice.dueAmount) {
    return res.status(400).json({
      success: false,
      message: `Amount ${amount} exceeds remaining invoice balance of ${invoice.dueAmount}`
    });
  }

  const paymentNumber = 'PAY-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
  const payment: Payment = {
    id: 'pay_' + Math.random().toString(36).substr(2, 9),
    paymentNumber,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    patientId: invoice.patientId,
    patientName: invoice.patientName,
    branchId: invoice.branchId,
    organizationId: invoice.organizationId,
    amount: Number(amount),
    method: method || 'CASH',
    reference: reference || null,
    notes: notes || null,
    receivedBy: req.user?.id || 'usr_finance',
    receivedByName: req.user?.fullName || 'Accounts Officer',
    createdAt: new Date().toISOString()
  };

  if (!db.raw.payments) db.raw.payments = [];
  db.raw.payments.unshift(payment);

  // Update invoice balance
  invoice.paidAmount += Number(amount);
  const total = invoice.totalAmount ?? invoice.netPayable;
  invoice.dueAmount = Math.max(0, total - invoice.paidAmount);
  invoice.status = invoice.dueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
  invoice.updatedAt = new Date().toISOString();

  // If active shift exists, update shift cash totals
  const activeShift = (db.raw.receptionistShifts || []).find(s => s.status === 'ACTIVE');
  if (activeShift) {
    if (payment.method === 'CASH') activeShift.totalCashReceived += payment.amount;
    else if (payment.method === 'CARD') activeShift.totalCardReceived += payment.amount;
    else if (payment.method === 'MOBILE' || (payment.method as string) === 'MOBILE_BANKING') activeShift.totalMobileReceived += payment.amount;
    else if (payment.method === 'BANK' || (payment.method as string) === 'BANK_TRANSFER') activeShift.totalBankReceived += payment.amount;
    activeShift.expectedCash = activeShift.openingCash + activeShift.totalCashReceived;
  }

  db.persist();

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'FINANCE_RECEIVE_PAYMENT',
    'Payment',
    payment.id,
    null,
    { invoiceNumber: invoice.invoiceNumber, amount: payment.amount, method: payment.method }
  );

  realtimeHub.broadcast('PAYMENT_RECEIVED', {
    paymentId: payment.id,
    paymentNumber: payment.paymentNumber || payment.receiptNumber,
    invoiceNumber: invoice.invoiceNumber,
    patientName: invoice.patientName,
    amount: payment.amount,
    method: payment.method,
    newDueAmount: invoice.dueAmount,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({
    success: true,
    message: `Payment of ${amount} BDT recorded successfully for ${invoice.invoiceNumber}`,
    data: { payment, invoice }
  });
});

// ----------------------------------------------------
// 4. Refund Management & Authorization Workflow
// ----------------------------------------------------
router.get('/refunds', authenticate, (req: AuthRequest, res: Response): any => {
  const refunds = db.raw.refunds || [];
  refunds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, data: refunds });
});

router.post('/refunds', authenticate, (req: AuthRequest, res: Response): any => {
  const { invoiceId, amount, reason, method } = req.body;

  if (!invoiceId || !amount || amount <= 0 || !reason) {
    return res.status(400).json({ success: false, message: 'invoiceId, positive amount, and reason are required' });
  }

  const invoice = (db.raw.invoices || []).find(i => i.id === invoiceId);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  if (amount > invoice.paidAmount) {
    return res.status(400).json({
      success: false,
      message: `Refund amount ${amount} cannot exceed total collected amount ${invoice.paidAmount}`
    });
  }

  const refundNumber = 'RFD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const refund: Refund = {
    id: 'rfd_' + Math.random().toString(36).substr(2, 9),
    refundNumber,
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    patientId: invoice.patientId,
    patientName: invoice.patientName,
    amount: Number(amount),
    reason,
    method: method || 'CASH',
    status: 'PROCESSED',
    requestedBy: req.user?.fullName || 'Receptionist',
    approvedBy: req.user?.fullName || 'Finance Director',
    processedBy: req.user?.fullName || 'Accounts Officer',
    branchId: invoice.branchId,
    organizationId: invoice.organizationId,
    createdAt: new Date().toISOString(),
    processedAt: new Date().toISOString()
  };

  if (!db.raw.refunds) db.raw.refunds = [];
  db.raw.refunds.unshift(refund);

  // Update invoice balance
  invoice.paidAmount -= Number(amount);
  const total = invoice.totalAmount ?? invoice.netPayable;
  invoice.dueAmount = Math.max(0, total - invoice.paidAmount);
  if (invoice.paidAmount === 0) invoice.status = 'REFUNDED';
  else invoice.status = 'PARTIALLY_PAID';
  invoice.updatedAt = new Date().toISOString();

  // If active shift exists, reflect refund
  const activeShift = (db.raw.receptionistShifts || []).find(s => s.status === 'ACTIVE');
  if (activeShift) {
    activeShift.totalRefunds += refund.amount;
    if (refund.method === 'CASH') {
      activeShift.totalCashReceived = Math.max(0, activeShift.totalCashReceived - refund.amount);
      activeShift.expectedCash = activeShift.openingCash + activeShift.totalCashReceived;
    }
  }

  db.persist();

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'FINANCE_PROCESS_REFUND',
    'Refund',
    refund.id,
    null,
    { refundNumber, invoiceNumber: invoice.invoiceNumber, amount: refund.amount, reason }
  );

  realtimeHub.broadcast('PAYMENT_REFUNDED', {
    refundId: refund.id,
    refundNumber: refund.refundNumber,
    invoiceNumber: invoice.invoiceNumber,
    patientName: invoice.patientName,
    amount: refund.amount,
    reason,
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({
    success: true,
    message: `Refund #${refundNumber} processed successfully for ${invoice.invoiceNumber}`,
    data: { refund, invoice }
  });
});

// ----------------------------------------------------
// 5. Operational Expenses Ledger & Approval
// ----------------------------------------------------
router.get('/expenses', authenticate, (req: AuthRequest, res: Response): any => {
  let expenses = [...(db.raw.expenses || [])];
  const { category, status, search } = req.query;

  if (category && category !== 'ALL') {
    expenses = expenses.filter(e => e.category === category);
  }
  if (status && status !== 'ALL') {
    expenses = expenses.filter(e => e.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    expenses = expenses.filter(e => 
      e.vendorPayee?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.expenseNumber?.toLowerCase().includes(q)
    );
  }

  expenses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, data: expenses });
});

router.post('/expenses', authenticate, (req: AuthRequest, res: Response): any => {
  const { category, amount, date, vendorPayee, paymentMethod, reference, description } = req.body;

  if (!category || !amount || amount <= 0 || !vendorPayee) {
    return res.status(400).json({ success: false, message: 'Category, positive amount, and vendorPayee are required' });
  }

  const expenseNumber = 'EXP-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const expense: Expense = {
    id: 'exp_' + Math.random().toString(36).substr(2, 9),
    expenseNumber,
    category,
    amount: Number(amount),
    date: date || new Date().toISOString().slice(0, 10),
    vendorPayee,
    paymentMethod: paymentMethod || 'CASH',
    reference: reference || '',
    description: description || '',
    status: 'APPROVED',
    createdBy: req.user?.fullName || 'Accounts Clerk',
    approvedBy: req.user?.fullName || 'Finance Manager',
    branchId: req.user?.branchId || 'br_pch_main',
    organizationId: req.user?.organizationId || 'org_pch',
    createdAt: new Date().toISOString()
  };

  if (!db.raw.expenses) db.raw.expenses = [];
  db.raw.expenses.unshift(expense);
  db.persist();

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'FINANCE_RECORD_EXPENSE',
    'Expense',
    expense.id,
    null,
    { expenseNumber, vendorPayee, amount: expense.amount }
  );

  realtimeHub.broadcast('EXPENSE_CREATED', {
    expenseId: expense.id,
    expenseNumber: expense.expenseNumber,
    category: expense.category,
    amount: expense.amount,
    vendorPayee: expense.vendorPayee
  });

  return res.status(201).json({
    success: true,
    message: `Expense #${expenseNumber} recorded successfully`,
    data: expense
  });
});

// ----------------------------------------------------
// 6. Sales Agent Commission Ledger & Disbursement
// ----------------------------------------------------
router.get('/commissions', authenticate, (req: AuthRequest, res: Response): any => {
  let commissions = [...(db.raw.salesAgentCommissions || [])];
  const { status, agentId } = req.query;

  if (status && status !== 'ALL') {
    commissions = commissions.filter(c => c.status === status);
  }
  if (agentId) {
    commissions = commissions.filter(c => c.salesAgentId === agentId);
  }

  commissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ success: true, data: commissions });
});

router.post('/commissions/:id/payout', authenticate, (req: AuthRequest, res: Response): any => {
  const comm = (db.raw.salesAgentCommissions || []).find(c => c.id === req.params.id);
  if (!comm) return res.status(404).json({ success: false, message: 'Commission record not found' });

  const { paymentMethod, payoutReference } = req.body;

  comm.status = 'PAID';
  comm.paidAt = new Date().toISOString();
  comm.updatedAt = new Date().toISOString();
  db.persist();

  const commAmount = comm.commissionAmount || comm.commissionEarned || 0;

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'FINANCE_COMMISSION_PAYOUT',
    'SalesAgentCommission',
    comm.id,
    null,
    { agentName: comm.salesAgentName, amount: commAmount, reference: payoutReference }
  );

  realtimeHub.broadcast('COMMISSION_PAID', {
    commissionId: comm.id,
    agentName: comm.salesAgentName,
    amount: commAmount,
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: `Commission of ${commAmount} BDT disbursed to ${comm.salesAgentName}`,
    data: comm
  });
});

// ----------------------------------------------------
// 7. Cash Register Reconciliation & Closing
// ----------------------------------------------------
router.get('/cash-closing', authenticate, (req: AuthRequest, res: Response): any => {
  const closings = db.raw.cashClosings || [];
  const today = new Date().toISOString().slice(0, 10);
  const todayPayments = (db.raw.payments || []).filter(p => p.createdAt?.slice(0, 10) === today && p.method === 'CASH');
  const todayCashExpenses = (db.raw.expenses || []).filter(e => (e.createdAt?.slice(0, 10) === today || e.date === today) && e.paymentMethod === 'CASH');
  const todayCashRefunds = (db.raw.refunds || []).filter(r => r.createdAt?.slice(0, 10) === today && r.method === 'CASH');

  const openingCash = 5000;
  const cashCollection = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  const cashExpenses = todayCashExpenses.reduce((sum, e) => sum + e.amount, 0);
  const cashRefunds = todayCashRefunds.reduce((sum, r) => sum + r.amount, 0);
  const expectedCash = openingCash + cashCollection - cashExpenses - cashRefunds;

  return res.json({
    success: true,
    data: {
      currentSession: {
        date: today,
        openingCash,
        cashCollection,
        cashExpenses,
        cashRefunds,
        expectedCash
      },
      history: closings
    }
  });
});

router.post('/cash-closing', authenticate, (req: AuthRequest, res: Response): any => {
  const { actualCash, varianceExplanation, notes } = req.body;

  if (actualCash === undefined || actualCash === null || isNaN(Number(actualCash))) {
    return res.status(400).json({ success: false, message: 'Actual counted cash amount is required' });
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayPayments = (db.raw.payments || []).filter(p => p.createdAt?.slice(0, 10) === today && p.method === 'CASH');
  const todayCashExpenses = (db.raw.expenses || []).filter(e => (e.createdAt?.slice(0, 10) === today || e.date === today) && e.paymentMethod === 'CASH');
  const todayCashRefunds = (db.raw.refunds || []).filter(r => r.createdAt?.slice(0, 10) === today && r.method === 'CASH');

  const openingCash = 5000;
  const cashCollection = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  const cashExpenses = todayCashExpenses.reduce((sum, e) => sum + e.amount, 0);
  const cashRefunds = todayCashRefunds.reduce((sum, r) => sum + r.amount, 0);
  const expectedCash = openingCash + cashCollection - cashExpenses - cashRefunds;

  const counted = Number(actualCash);
  const variance = counted - expectedCash;
  const isBalanced = Math.abs(variance) < 0.01;

  if (!isBalanced && (!varianceExplanation || varianceExplanation.trim() === '')) {
    return res.status(400).json({
      success: false,
      message: `Cash discrepancy detected (${variance > 0 ? '+' : ''}${variance} BDT). A mandatory explanation is required.`
    });
  }

  const closingNumber = 'CLS-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
  const closingRecord: CashClosing = {
    id: 'cls_' + Math.random().toString(36).substr(2, 9),
    closingNumber,
    closingDate: today,
    branchId: req.user?.branchId || 'br_pch_main',
    organizationId: req.user?.organizationId || 'org_pch',
    closedBy: req.user?.id || 'usr_finance',
    closedByName: req.user?.fullName || 'Accounts Officer',
    openingCash,
    cashCollection,
    cashExpenses,
    cashRefunds,
    expectedCash,
    actualCash: counted,
    variance,
    varianceExplanation: varianceExplanation || undefined,
    status: isBalanced ? 'BALANCED' : 'DISCREPANCY',
    notes: notes || undefined,
    createdAt: new Date().toISOString()
  };

  if (!db.raw.cashClosings) db.raw.cashClosings = [];
  db.raw.cashClosings.unshift(closingRecord);
  db.persist();

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'FINANCE_CASH_CLOSING',
    'CashClosing',
    closingRecord.id,
    null,
    { closingNumber, expectedCash, actualCash: counted, variance }
  );

  return res.status(201).json({
    success: true,
    message: `Cash register closed successfully for ${today}. Status: ${closingRecord.status}`,
    data: closingRecord
  });
});

export default router;
