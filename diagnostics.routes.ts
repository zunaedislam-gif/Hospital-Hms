/**
 * Pattern HMS - Diagnostic Tests, Pricing, Packages & Services Routes
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ----------------------------------------------------
// Test Categories
// ----------------------------------------------------
router.get('/categories', authenticate, (req: AuthRequest, res: Response) => {
  const cats = db.raw.testCategories.filter(c => !c.deletedAt);
  res.json({ success: true, data: cats });
});

router.post('/categories', authenticate, requirePermission('test.create'), (req: AuthRequest, res: Response): any => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Category Name and Code required.' });

    const newCat = {
      id: 'cat_' + Math.random().toString(36).substr(2, 8),
      name,
      code: code.toUpperCase().trim(),
      description: description || '',
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    };
    db.raw.testCategories.push(newCat);
    db.persist();

    return res.status(201).json({ success: true, message: 'Category created', data: newCat });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ----------------------------------------------------
// Diagnostic Tests
// ----------------------------------------------------
router.get('/tests', authenticate, requirePermission('test.view'), (req: AuthRequest, res: Response) => {
  const { categoryId, departmentId, search } = req.query as any;
  const tests = db.getDiagnosticTests({ categoryId, departmentId, search });

  const enriched = tests.map(t => {
    const cat = db.raw.testCategories.find(c => c.id === t.categoryId);
    const prices = db.raw.testPrices.filter(p => p.testId === t.id);
    return {
      ...t,
      categoryName: cat ? cat.name : 'General',
      branchPriceCount: prices.length
    };
  });

  res.json({ success: true, data: enriched });
});

router.post('/tests', authenticate, requirePermission('test.create'), (req: AuthRequest, res: Response): any => {
  try {
    const {
      name, code, categoryId, departmentId, sampleType,
      preparationInstructions, turnaroundHours, basePrice,
      discountEligible, taxPercent, reportType
    } = req.body;

    if (!name || !code || !categoryId || basePrice === undefined) {
      return res.status(400).json({ success: false, message: 'Name, Code, Category, and Base Price are required.' });
    }

    const newTest = db.createDiagnosticTest({
      name,
      code,
      categoryId,
      departmentId: departmentId || 'dept_lab',
      sampleType: sampleType || 'Venous Blood',
      preparationInstructions: preparationInstructions || 'Standard preparation',
      turnaroundHours: Number(turnaroundHours) || 4,
      basePrice: Number(basePrice) || 0,
      discountEligible: Boolean(discountEligible),
      taxPercent: Number(taxPercent) || 5,
      reportType: reportType || 'QUANTITATIVE',
      status: req.body.status || 'ACTIVE'
    }, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });

    return res.status(201).json({ success: true, message: 'Diagnostic test registered successfully', data: newTest });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/tests/:id', authenticate, requirePermission('test.edit'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.updateDiagnosticTest(req.params.id, req.body, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });
    return res.json({ success: true, message: 'Diagnostic test updated', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// Test Pricing (Global & Branch Overrides)
// ----------------------------------------------------
router.get('/prices', authenticate, requirePermission('price.manage'), (req: AuthRequest, res: Response) => {
  const { testId, orgId } = req.query as any;
  const list = db.raw.testPrices.filter(p => {
    if (testId && p.testId !== testId) return false;
    if (orgId && p.organizationId !== orgId) return false;
    return true;
  });

  const enriched = list.map(p => {
    const test = db.raw.diagnosticTests.find(t => t.id === p.testId);
    const branch = p.branchId ? db.getBranchById(p.branchId) : null;
    return {
      ...p,
      testName: test ? test.name : 'Unknown Test',
      testCode: test ? test.code : 'UNKNOWN',
      branchName: branch ? branch.name : 'Global (All Branches)'
    };
  });

  res.json({ success: true, data: enriched });
});

router.post('/prices', authenticate, requirePermission('price.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const { testId, organizationId, branchId, price, effectiveFrom } = req.body;
    if (!testId || !organizationId || price === undefined) {
      return res.status(400).json({ success: false, message: 'Test ID, Organization ID, and Price required.' });
    }

    const existingIdx = db.raw.testPrices.findIndex(
      p => p.testId === testId && p.organizationId === organizationId && p.branchId === (branchId || null)
    );

    let oldPrice: number | null = null;
    if (existingIdx >= 0) {
      oldPrice = db.raw.testPrices[existingIdx].price;
      db.raw.testPrices[existingIdx].oldPrice = oldPrice;
      db.raw.testPrices[existingIdx].price = Number(price);
      db.raw.testPrices[existingIdx].effectiveFrom = effectiveFrom || new Date().toISOString().split('T')[0];
      db.raw.testPrices[existingIdx].changedByUserId = req.user!.id;
    } else {
      const newPriceRec = {
        id: 'pr_' + Math.random().toString(36).substr(2, 8),
        testId,
        organizationId,
        branchId: branchId || null,
        price: Number(price),
        oldPrice: null,
        effectiveFrom: effectiveFrom || new Date().toISOString().split('T')[0],
        changedByUserId: req.user!.id,
        createdAt: new Date().toISOString()
      };
      db.raw.testPrices.push(newPriceRec);
    }

    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'UPDATE_TEST_PRICE',
      'DiagnosticTestPrice',
      testId,
      { price: oldPrice },
      { price: Number(price), branchId: branchId || 'GLOBAL' }
    );

    return res.json({ success: true, message: 'Test price configuration recorded.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// Test Packages
// ----------------------------------------------------
router.get('/packages', authenticate, requirePermission('test.view'), (req: AuthRequest, res: Response) => {
  const pkgs = db.raw.testPackages.filter(p => !p.deletedAt);
  const enriched = pkgs.map(pkg => {
    const includedTests = db.raw.diagnosticTests.filter(t => pkg.testIds.includes(t.id));
    return {
      ...pkg,
      tests: includedTests
    };
  });
  res.json({ success: true, data: enriched });
});

router.post('/packages', authenticate, requirePermission('test.create'), (req: AuthRequest, res: Response): any => {
  try {
    const { name, code, organizationId, testIds, originalPrice, packagePrice, discountPercent, taxPercent, validityDays } = req.body;
    if (!name || !code || !Array.isArray(testIds) || packagePrice === undefined) {
      return res.status(400).json({ success: false, message: 'Package Name, Code, Test List, and Package Price are required.' });
    }

    const newPkg = {
      id: 'pkg_' + Math.random().toString(36).substr(2, 8),
      name,
      code: code.toUpperCase().trim(),
      organizationId: organizationId || 'org_pch',
      testIds,
      originalPrice: Number(originalPrice) || 0,
      packagePrice: Number(packagePrice),
      discountPercent: Number(discountPercent) || 0,
      taxPercent: Number(taxPercent) || 5,
      validityDays: Number(validityDays) || 30,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    };

    db.raw.testPackages.push(newPkg);
    db.persist();

    return res.status(201).json({ success: true, message: 'Test package registered', data: newPkg });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// Hospital Services
// ----------------------------------------------------
router.get('/services', authenticate, requirePermission('service.manage'), (req: AuthRequest, res: Response) => {
  const list = db.raw.hospitalServices.filter(s => !s.deletedAt);
  res.json({ success: true, data: list });
});

router.post('/services', authenticate, requirePermission('service.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const { name, code, category, basePrice, taxPercent, organizationId, branchId } = req.body;
    if (!name || !code || basePrice === undefined) {
      return res.status(400).json({ success: false, message: 'Service Name, Code and Price are required.' });
    }

    const newService = {
      id: 'srv_' + Math.random().toString(36).substr(2, 8),
      name,
      code: code.toUpperCase().trim(),
      category: category || 'PROCEDURE',
      basePrice: Number(basePrice),
      taxPercent: Number(taxPercent) || 0,
      organizationId: organizationId || 'org_pch',
      branchId: branchId || null,
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    };

    db.raw.hospitalServices.push(newService);
    db.persist();

    return res.status(201).json({ success: true, message: 'Hospital service registered', data: newService });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
