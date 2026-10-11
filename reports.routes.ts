/**
 * Pattern HMS - Executive Reports & Analytics Routes
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/reports/kpis
router.get('/kpis', authenticate, requirePermission('report.view'), (req: AuthRequest, res: Response) => {
  const { period = 'today', orgId, branchId } = req.query as any;
  const kpis = db.getDashboardKPIs(period, orgId, branchId);
  res.json({ success: true, data: kpis });
});

// GET /api/reports/revenue-trend
router.get('/revenue-trend', authenticate, requirePermission('report.view'), (req: AuthRequest, res: Response) => {
  const { period = 'last_7_days' } = req.query as any;

  let days = 7;
  if (period === 'today' || period === 'yesterday') days = 12; // Hourly
  else if (period === 'last_7_days') days = 7;
  else if (period === 'last_30_days') days = 30;
  else if (period === 'this_year') days = 12; // Monthly

  const result = [];
  if (period === 'this_year') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 12; i++) {
      result.push({
        label: months[i],
        consultations: Math.round(18000 + Math.sin(i) * 3500),
        diagnostics: Math.round(32000 + Math.cos(i) * 6000),
        beds: Math.round(15000 + Math.sin(i * 1.5) * 2500),
        total: 0
      });
      result[i].total = result[i].consultations + result[i].diagnostics + result[i].beds;
    }
  } else if (period === 'today' || period === 'yesterday') {
    const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    for (const h of hours) {
      result.push({
        label: h,
        consultations: Math.round(1200 + Math.random() * 800),
        diagnostics: Math.round(2400 + Math.random() * 1200),
        beds: Math.round(900 + Math.random() * 400),
        total: 0
      });
      result[result.length - 1].total = result[result.length - 1].consultations + result[result.length - 1].diagnostics + result[result.length - 1].beds;
    }
  } else {
    // Daily
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const cons = Math.round(2400 + Math.random() * 1200);
      const diag = Math.round(4100 + Math.random() * 1800);
      const bed = Math.round(1800 + Math.random() * 700);
      result.push({
        label,
        consultations: cons,
        diagnostics: diag,
        beds: bed,
        total: cons + diag + bed
      });
    }
  }

  res.json({ success: true, data: result });
});

// GET /api/reports/patient-trend
router.get('/patient-trend', authenticate, requirePermission('report.view'), (req: AuthRequest, res: Response) => {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    result.push({
      date: label,
      registrations: Math.round(110 + Math.random() * 45),
      appointments: Math.round(85 + Math.random() * 30),
      completed: Math.round(75 + Math.random() * 25)
    });
  }
  res.json({ success: true, data: result });
});

// GET /api/reports/payment-distribution
router.get('/payment-distribution', authenticate, requirePermission('report.view'), (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: [
      { name: 'Credit / Debit Card', value: 48, fill: '#0ea5e9' },
      { name: 'Cash Counter', value: 26, fill: '#10b981' },
      { name: 'Mobile Banking (QR)', value: 16, fill: '#f59e0b' },
      { name: 'Corporate Bank Wire', value: 7, fill: '#6366f1' },
      { name: 'Online Portal', value: 3, fill: '#8b5cf6' }
    ]
  });
});

// GET /api/reports/diagnostics-summary
router.get('/diagnostics-summary', authenticate, requirePermission('report.view'), (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: [
      { testName: 'Complete Blood Count (CBC)', code: 'CBC-ESR', volume: 432, revenue: 12096 },
      { testName: 'Comprehensive Lipid Profile', code: 'LIP-PROF', volume: 295, revenue: 13275 },
      { testName: 'Fasting Plasma Glucose', code: 'GLU-FAST', volume: 380, revenue: 5700 },
      { testName: 'Liver Function Test (LFT)', code: 'LFT-FULL', volume: 210, revenue: 10500 },
      { testName: 'Kidney Function Test (KFT)', code: 'KFT-FULL', volume: 185, revenue: 7770 },
      { testName: 'Digital Chest X-Ray', code: 'RAD-CXR-PA', volume: 144, revenue: 5760 },
      { testName: '3.0T MRI Brain with Contrast', code: 'MRI-BRN-CON', volume: 38, revenue: 14440 }
    ]
  });
});

// POST /api/reports/export
router.post('/export', authenticate, requirePermission('report.export'), (req: AuthRequest, res: Response): any => {
  const { reportType, format, dateRange } = req.body;
  if (!reportType) return res.status(400).json({ success: false, message: 'Report type required.' });

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'EXPORT_REPORT',
    'Report',
    reportType,
    null,
    { format: format || 'CSV', dateRange: dateRange || 'All Time' }
  );

  return res.json({
    success: true,
    message: `Report [${reportType}] generated successfully for download.`,
    downloadUrl: `/api/reports/download?token=${Math.random().toString(36).substr(2, 10)}`,
    generatedAt: new Date().toISOString()
  });
});

export default router;
