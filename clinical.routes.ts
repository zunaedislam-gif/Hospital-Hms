/**
 * Pattern HMS - Clinical Configuration Routes
 * Covers: Doctors, Specialties, Departments, Chambers, Pathologists, and Employees
 */
import { Router, Response } from 'express';
import { db } from '../db/store.js';
import { authenticate, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ----------------------------------------------------
// Departments
// ----------------------------------------------------
router.get('/departments', authenticate, (req: AuthRequest, res: Response) => {
  const orgId = req.query.orgId as string | undefined;
  const depts = db.raw.departments.filter(d => {
    if (d.deletedAt) return false;
    if (orgId && d.organizationId !== orgId) return false;
    return true;
  });
  res.json({ success: true, data: depts });
});

router.post('/departments', authenticate, requirePermission('department.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const { organizationId, branchId, name, code, description, headOfDepartment } = req.body;
    if (!name || !code || !organizationId) {
      return res.status(400).json({ success: false, message: 'Organization, Department Name, and Code are required.' });
    }

    const newDept = {
      id: 'dept_' + Math.random().toString(36).substr(2, 8),
      organizationId,
      branchId: branchId || null,
      name,
      code: code.toUpperCase().trim(),
      description: description || '',
      headOfDepartment: headOfDepartment || '',
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    };
    db.raw.departments.push(newDept);
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'CREATE_DEPARTMENT',
      'Department',
      newDept.id,
      null,
      newDept
    );

    return res.status(201).json({ success: true, message: 'Department created successfully', data: newDept });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

router.patch('/departments/:id', authenticate, requirePermission('department.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const dept = db.raw.departments.find(d => d.id === req.params.id && !d.deletedAt);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    Object.assign(dept, req.body);
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'UPDATE_DEPARTMENT',
      'Department',
      dept.id,
      null,
      dept
    );

    return res.json({ success: true, message: 'Department updated successfully', data: dept });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

router.delete('/departments/:id', authenticate, requirePermission('department.manage'), (req: AuthRequest, res: Response): any => {
  const dept = db.raw.departments.find(d => d.id === req.params.id && !d.deletedAt);
  if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

  dept.deletedAt = new Date().toISOString();
  db.persist();

  db.logAudit(
    { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
    'DELETE_DEPARTMENT',
    'Department',
    dept.id,
    null,
    { deletedAt: dept.deletedAt }
  );

  return res.json({ success: true, message: 'Department archived successfully' });
});

// ----------------------------------------------------
// Specialties
// ----------------------------------------------------
router.get('/specialties', authenticate, (req: AuthRequest, res: Response) => {
  const list = db.raw.specialties.filter(s => !s.deletedAt);
  res.json({ success: true, data: list });
});

router.post('/specialties', authenticate, requirePermission('specialty.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Specialty Name and Code required.' });

    const newSpec = {
      id: 'spec_' + Math.random().toString(36).substr(2, 8),
      name,
      code: code.toUpperCase().trim(),
      description: description || '',
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    };
    db.raw.specialties.push(newSpec);
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'CREATE_SPECIALTY',
      'Specialty',
      newSpec.id,
      null,
      newSpec
    );

    return res.status(201).json({ success: true, message: 'Specialty registered', data: newSpec });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ----------------------------------------------------
// Doctors
// ----------------------------------------------------
router.get('/doctors', authenticate, requirePermission('doctor.view'), (req: AuthRequest, res: Response) => {
  const { orgId, branchId, specialtyId, status } = req.query as any;
  const docs = db.getDoctors({ orgId, branchId, specialtyId, status });

  const enriched = docs.map(doc => {
    const org = db.getOrganizationById(doc.organizationId);
    const branch = db.getBranchById(doc.branchId);
    const spec = db.raw.specialties.find(s => s.id === doc.specialtyId);
    const chamber = doc.chamberId ? db.raw.chambers.find(c => c.id === doc.chamberId) : null;
    return {
      ...doc,
      organizationName: org ? org.name : 'Unknown Hospital',
      branchName: branch ? branch.name : 'Unknown Branch',
      specialtyName: spec ? spec.name : doc.specialtyName || 'Specialist',
      chamberName: chamber ? `${chamber.name} (${chamber.number})` : 'Unassigned Chamber'
    };
  });

  res.json({ success: true, data: enriched });
});

router.post('/doctors', authenticate, requirePermission('doctor.create'), (req: AuthRequest, res: Response): any => {
  try {
    const {
      fullName, doctorId, medicalRegNumber, specialtyId, qualifications, experienceYears,
      gender, phone, email, organizationId, branchId, departmentId, consultationFee,
      followUpFee, emergencyFee, chamberId, schedule, status
    } = req.body;

    if (!fullName || !medicalRegNumber || !specialtyId || !organizationId || !branchId) {
      return res.status(400).json({ success: false, message: 'Missing required doctor profile fields.' });
    }

    const newDoc = db.createDoctor({
      userId: req.body.userId || 'usr_doc_' + Math.random().toString(36).substr(2, 6),
      fullName,
      doctorId: doctorId || 'DOC-' + Math.floor(1000 + Math.random() * 9000),
      medicalRegNumber,
      specialtyId,
      specialtyName: req.body.specialtyName || '',
      qualifications: qualifications || '',
      experienceYears: Number(experienceYears) || 0,
      gender: gender || 'MALE',
      phone: phone || '',
      email: email || '',
      organizationId,
      branchId,
      departmentId: departmentId || '',
      consultationFee: Number(consultationFee) || 50,
      followUpFee: Number(followUpFee) || 25,
      emergencyFee: Number(emergencyFee) || 100,
      chamberId: chamberId || null,
      schedule: Array.isArray(schedule) ? schedule : [
        { day: 'Monday', startTime: '09:00', endTime: '13:00', maxPatients: 20 },
        { day: 'Wednesday', startTime: '09:00', endTime: '13:00', maxPatients: 20 }
      ],
      status: status || 'AVAILABLE'
    }, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });

    return res.status(201).json({ success: true, message: 'Doctor profile created successfully', data: newDoc });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/doctors/:id', authenticate, requirePermission('doctor.edit'), (req: AuthRequest, res: Response): any => {
  try {
    const updated = db.updateDoctor(req.params.id, req.body, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });
    return res.json({ success: true, message: 'Doctor details updated successfully', data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/doctors/:id', authenticate, requirePermission('doctor.edit'), (req: AuthRequest, res: Response): any => {
  try {
    db.deleteDoctor(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.roleCode
    });
    return res.json({ success: true, message: 'Doctor archived successfully' });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// Chambers
// ----------------------------------------------------
router.get('/chambers', authenticate, (req: AuthRequest, res: Response) => {
  const branchId = req.query.branchId as string | undefined;
  const list = db.raw.chambers.filter(c => {
    if (c.deletedAt) return false;
    if (branchId && c.branchId !== branchId) return false;
    return true;
  });
  res.json({ success: true, data: list });
});

router.post('/chambers', authenticate, requirePermission('doctor.edit'), (req: AuthRequest, res: Response): any => {
  try {
    const { name, number, branchId, departmentId, assignedDoctorId, displayScreenId } = req.body;
    if (!name || !number || !branchId) {
      return res.status(400).json({ success: false, message: 'Name, Number and Branch ID are required.' });
    }

    const newChamber = {
      id: 'chm_' + Math.random().toString(36).substr(2, 8),
      name,
      number,
      branchId,
      departmentId: departmentId || '',
      assignedDoctorId: assignedDoctorId || null,
      displayScreenId: displayScreenId || null,
      currentQueueToken: null,
      status: 'AVAILABLE' as const,
      createdAt: new Date().toISOString()
    };
    db.raw.chambers.push(newChamber);
    db.persist();

    return res.status(201).json({ success: true, message: 'Chamber registered', data: newChamber });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ----------------------------------------------------
// Pathologists
// ----------------------------------------------------
router.get('/pathologists', authenticate, requirePermission('pathologist.manage'), (req: AuthRequest, res: Response) => {
  const orgId = req.query.orgId as string | undefined;
  const list = db.raw.pathologists.filter(p => {
    if (p.deletedAt) return false;
    if (orgId && p.organizationId !== orgId) return false;
    return true;
  });
  res.json({ success: true, data: list });
});

router.post('/pathologists', authenticate, requirePermission('pathologist.manage'), (req: AuthRequest, res: Response): any => {
  try {
    const { fullName, employeeId, qualification, registrationNumber, specialty, organizationId, branchId, laboratoryName, contactPhone, email } = req.body;
    if (!fullName || !registrationNumber || !organizationId || !branchId) {
      return res.status(400).json({ success: false, message: 'Full name, registration number, and organization are required.' });
    }

    const newPath = {
      id: 'pth_' + Math.random().toString(36).substr(2, 8),
      userId: req.body.userId || 'usr_pth_' + Math.random().toString(36).substr(2, 6),
      fullName,
      employeeId: employeeId || 'PTH-' + Math.floor(2000 + Math.random() * 8000),
      qualification: qualification || 'MBBS, MD',
      registrationNumber,
      specialty: specialty || 'Pathology & Laboratory Medicine',
      organizationId,
      branchId,
      laboratoryName: laboratoryName || 'Main Pathology Lab',
      contactPhone: contactPhone || '',
      email: email || '',
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    };

    db.raw.pathologists.push(newPath);
    db.persist();

    db.logAudit(
      { id: req.user!.id, email: req.user!.email, role: req.user!.roleCode },
      'CREATE_PATHOLOGIST',
      'Pathologist',
      newPath.id,
      null,
      newPath
    );

    return res.status(201).json({ success: true, message: 'Pathologist created successfully', data: newPath });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// ----------------------------------------------------
// Employees
// ----------------------------------------------------
router.get('/employees', authenticate, requirePermission('user.view'), (req: AuthRequest, res: Response) => {
  const orgId = req.query.orgId as string | undefined;
  const list = db.raw.employees.filter(e => {
    if (e.deletedAt) return false;
    if (orgId && e.organizationId !== orgId) return false;
    return true;
  });
  res.json({ success: true, data: list });
});

router.post('/employees', authenticate, requirePermission('user.create'), (req: AuthRequest, res: Response): any => {
  try {
    const { fullName, employeeId, designation, departmentId, organizationId, branchId, role, phone, email, joiningDate } = req.body;
    if (!fullName || !designation || !organizationId || !branchId) {
      return res.status(400).json({ success: false, message: 'Missing required employee fields.' });
    }

    const newEmp = {
      id: 'emp_' + Math.random().toString(36).substr(2, 8),
      userId: req.body.userId || 'usr_emp_' + Math.random().toString(36).substr(2, 6),
      fullName,
      employeeId: employeeId || 'EMP-' + Math.floor(3000 + Math.random() * 7000),
      designation,
      departmentId: departmentId || '',
      organizationId,
      branchId,
      role: role || 'OTHER_EMPLOYEE',
      phone: phone || '',
      email: email || '',
      joiningDate: joiningDate || new Date().toISOString().split('T')[0],
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString()
    };

    db.raw.employees.push(newEmp);
    db.persist();

    return res.status(201).json({ success: true, message: 'Employee registered', data: newEmp });
  } catch (err: any) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
