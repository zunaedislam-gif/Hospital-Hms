/**
 * Pattern HMS - Billing, Tax & Payment Configuration Routes
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Invoice Configuration
router.get('/config', authenticate, (req: AuthRequest, res: Response) => {
  const orgId = req.query.orgId as string | undefined;
  const list = db.raw.billingConfigurations.filter(c => {
    if (orgId && c.organizationId !== orgId) return false;
    return true;
  });
  res.json({ success: true, data: list });
});

router.post('/config', authenticate, requirePermission('billing.config'), (req: AuthRequest, res: Response): any => {
  const { organizationId, invoicePrefix, invoiceNumberFormat, invoiceStartingNumber, defaultDueDays, invoiceFooter, receiptFormat, refundPolicy, cancellationPolicy } = req.body;
  if (!organizationId || !invoicePrefix) return res.status(400).json({ success: false, message: 'Organization and Invoice Prefix required.' });

  const idx = db.raw.billingConfigurations.findIndex(b => b.organizationId === organizationId);
  const cfgData = {
    id: idx >= 0 ? db.raw.billingConfigurations[idx].id : 'bill_' + Math.random().toString(36).substr(2, 8),
    organizationId,
    invoicePrefix: invoicePrefix.toUpperCase(),
    invoiceNumberFormat: invoiceNumberFormat || '{PREFIX}-{YEAR}-{SEQ}',
    invoiceStartingNumber: Number(invoiceStartingNumber) || 1001,
    defaultDueDays: Number(defaultDueDays) || 7,
    invoiceFooter: invoiceFooter || '',
    receiptFormat: receiptFormat || 'STANDARD_A4',
    refundPolicy: refundPolicy || '',
    cancellationPolicy: cancellationPolicy || '',
    createdAt: new Date().toISOString()
  };

  if (idx >= 0) {
    db.raw.billingConfigurations[idx] = cfgData;
  } else {
    db.raw.billingConfigurations.push(cfgData);
  }

  db.persist();
  return res.json({ success: true, message: 'Billing configuration saved', data: cfgData });
});

// Payment Methods
router.get('/payment-methods', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: db.raw.paymentMethods });
});

router.post('/payment-methods', authenticate, requirePermission('billing.config'), (req: AuthRequest, res: Response): any => {
  const { name, code, description, isEnabled, surchargePercent } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'Method Name and Code required.' });

  const newPM = {
    id: 'pm_' + Math.random().toString(36).substr(2, 8),
    name,
    code,
    description: description || '',
    isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
    surchargePercent: Number(surchargePercent) || 0,
    createdAt: new Date().toISOString()
  };
  db.raw.paymentMethods.push(newPM);
  db.persist();

  return res.status(201).json({ success: true, data: newPM });
});

router.patch('/payment-methods/:id', authenticate, requirePermission('billing.config'), (req: AuthRequest, res: Response): any => {
  const pm = db.raw.paymentMethods.find(p => p.id === req.params.id);
  if (!pm) return res.status(404).json({ success: false, message: 'Payment method not found' });

  Object.assign(pm, req.body);
  db.persist();

  return res.json({ success: true, message: 'Payment method updated', data: pm });
});

// Tax / VAT Rates
router.get('/tax-rates', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: db.raw.taxRates });
});

router.post('/tax-rates', authenticate, requirePermission('billing.config'), (req: AuthRequest, res: Response): any => {
  const { name, ratePercent, taxType, effectiveFrom } = req.body;
  if (!name || ratePercent === undefined) return res.status(400).json({ success: false, message: 'Name and Rate required.' });

  const newTax = {
    id: 'tax_' + Math.random().toString(36).substr(2, 8),
    name,
    ratePercent: Number(ratePercent),
    taxType: taxType || 'VAT',
    effectiveFrom: effectiveFrom || new Date().toISOString().split('T')[0],
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString()
  };
  db.raw.taxRates.push(newTax);
  db.persist();

  return res.status(201).json({ success: true, data: newTax });
});

router.patch('/tax-rates/:id', authenticate, requirePermission('billing.config'), (req: AuthRequest, res: Response): any => {
  const tax = db.raw.taxRates.find(t => t.id === req.params.id);
  if (!tax) return res.status(404).json({ success: false, message: 'Tax rule not found' });

  Object.assign(tax, req.body);
  db.persist();

  return res.json({ success: true, message: 'Tax rule updated', data: tax });
});

// Financial Categories
router.get('/financial-categories', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: db.raw.financialCategories });
});

router.post('/financial-categories', authenticate, requirePermission('billing.config'), (req: AuthRequest, res: Response): any => {
  const { name, type, code, description } = req.body;
  if (!name || !type || !code) return res.status(400).json({ success: false, message: 'Name, Type and Code required.' });

  const newCat = {
    id: 'fc_' + Math.random().toString(36).substr(2, 8),
    name,
    type: type as 'INCOME' | 'EXPENSE',
    code: code.toUpperCase().trim(),
    description: description || '',
    isSystem: false,
    createdAt: new Date().toISOString()
  };
  db.raw.financialCategories.push(newCat);
  db.persist();

  return res.status(201).json({ success: true, data: newCat });
});

export default router;
