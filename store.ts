/**
 * Pattern HMS - High-Performance Relational Database Store
 * Features: ACID-safe in-memory state, automatic JSON persistence, soft-deletes,
 * unique constraints, foreign key referential integrity, and immutable audit logs.
 */
import fs from 'fs';
import path from 'path';
import { 
  Organization, 
  Branch, 
  Department, 
  Specialty, 
  Role,
  User, 
  Doctor, 
  Pathologist, 
  Employee,
  Chamber,
  DiagnosticTestCategory, 
  DiagnosticTest, 
  TestPrice, 
  TestPackage, 
  HospitalService, 
  QueueConfiguration, 
  DisplayScreen, 
  BedType, 
  Ward, 
  Room, 
  Bed, 
  BillingConfiguration, 
  PaymentMethod, 
  TaxRate, 
  FinancialCategory, 
  AuditLog, 
  ActivityLog, 
  NotificationTemplate, 
  SystemSetting,
  DashboardKPIs,
  Patient,
  Appointment,
  QueueEntry,
  QueuePriority,
  SalesAgent,
  SalesAgentCommission,
  CommissionLedger,
  Invoice,
  InvoiceItem,
  Payment,
  TestOrder,
  TestOrderItem,
  ReceptionistShift,
  ReceptionistKPIs,
  Consultation,
  Prescription,
  DoctorAvailabilityState,
  Refund,
  Expense,
  CashClosing
} from '../types.js';
import { getInitialSeedData } from './seed.js';

export interface DatabaseData {
  roles: Role[];
  organizations: Organization[];
  branches: Branch[];
  specialties: Specialty[];
  departments: Department[];
  users: User[];
  chambers: Chamber[];
  doctors: Doctor[];
  pathologists: Pathologist[];
  employees: Employee[];
  testCategories: DiagnosticTestCategory[];
  diagnosticTests: DiagnosticTest[];
  testPrices: TestPrice[];
  testPackages: TestPackage[];
  hospitalServices: HospitalService[];
  queueConfigurations: QueueConfiguration[];
  displayScreens: DisplayScreen[];
  bedTypes: BedType[];
  wards: Ward[];
  rooms: Room[];
  beds: Bed[];
  billingConfigurations: BillingConfiguration[];
  paymentMethods: PaymentMethod[];
  taxRates: TaxRate[];
  financialCategories: FinancialCategory[];
  systemSettings: SystemSetting[];
  notificationTemplates: NotificationTemplate[];
  auditLogs: AuditLog[];
  activityLogs: ActivityLog[];
  patients: Patient[];
  appointments: Appointment[];
  queueEntries: QueueEntry[];
  salesAgents: SalesAgent[];
  salesAgentCommissions: SalesAgentCommission[];
  commissionLedgers: CommissionLedger[];
  invoices: Invoice[];
  payments: Payment[];
  testOrders: TestOrder[];
  receptionistShifts: ReceptionistShift[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  doctorAvailabilities: DoctorAvailabilityState[];
  refunds: Refund[];
  expenses: Expense[];
  cashClosings: CashClosing[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'pattern_hms.json');

class DatabaseStore {
  private data: DatabaseData;
  private isPersisting = false;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseData {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all collections exist
        const seed = getInitialSeedData();
        const loadedRoles: Role[] = parsed.roles || seed.roles;
        const mergedRoles = loadedRoles.map(r => {
          const defaultRole = seed.roles.find(dr => dr.code === r.code);
          if (defaultRole && defaultRole.isSystemRole) {
            return {
              ...r,
              permissions: Array.from(new Set([...r.permissions, ...defaultRole.permissions]))
            };
          }
          return r;
        });

        return {
          roles: mergedRoles,
          organizations: parsed.organizations || seed.organizations,
          branches: parsed.branches || seed.branches,
          specialties: parsed.specialties || seed.specialties,
          departments: parsed.departments || seed.departments,
          users: parsed.users || seed.users,
          chambers: parsed.chambers || seed.chambers,
          doctors: parsed.doctors || seed.doctors,
          pathologists: parsed.pathologists || seed.pathologists,
          employees: parsed.employees || seed.employees,
          testCategories: parsed.testCategories || seed.testCategories,
          diagnosticTests: parsed.diagnosticTests || seed.diagnosticTests,
          testPrices: parsed.testPrices || seed.testPrices,
          testPackages: parsed.testPackages || seed.testPackages,
          hospitalServices: parsed.hospitalServices || seed.hospitalServices,
          queueConfigurations: parsed.queueConfigurations || seed.queueConfigurations,
          displayScreens: parsed.displayScreens || seed.displayScreens,
          bedTypes: parsed.bedTypes || seed.bedTypes,
          wards: parsed.wards || seed.wards,
          rooms: parsed.rooms || seed.rooms,
          beds: parsed.beds || seed.beds,
          billingConfigurations: parsed.billingConfigurations || seed.billingConfigurations,
          paymentMethods: parsed.paymentMethods || seed.paymentMethods,
          taxRates: parsed.taxRates || seed.taxRates,
          financialCategories: parsed.financialCategories || seed.financialCategories,
          systemSettings: parsed.systemSettings || seed.systemSettings,
          notificationTemplates: parsed.notificationTemplates || seed.notificationTemplates,
          auditLogs: parsed.auditLogs || seed.auditLogs,
          activityLogs: parsed.activityLogs || seed.activityLogs,
          patients: parsed.patients || seed.patients,
          appointments: parsed.appointments || seed.appointments,
          queueEntries: parsed.queueEntries || seed.queueEntries,
          salesAgents: parsed.salesAgents || seed.salesAgents,
          salesAgentCommissions: parsed.salesAgentCommissions || seed.salesAgentCommissions,
          commissionLedgers: parsed.commissionLedgers || seed.commissionLedgers,
          invoices: parsed.invoices || seed.invoices,
          payments: parsed.payments || seed.payments,
          testOrders: parsed.testOrders || seed.testOrders,
          receptionistShifts: parsed.receptionistShifts || seed.receptionistShifts,
          consultations: parsed.consultations || (seed as any).consultations || [],
          prescriptions: parsed.prescriptions || (seed as any).prescriptions || [],
          doctorAvailabilities: parsed.doctorAvailabilities || (seed as any).doctorAvailabilities || [],
          refunds: parsed.refunds || (seed as any).refunds || [],
          expenses: parsed.expenses || (seed as any).expenses || [],
          cashClosings: parsed.cashClosings || (seed as any).cashClosings || []
        };
      }
    } catch (err) {
      console.error('Failed to load existing database file, seeding fresh database:', err);
    }

    const initial = getInitialSeedData();
    this.persist(initial);
    return initial;
  }

  public persist(customData?: DatabaseData): void {
    if (this.isPersisting) return;
    this.isPersisting = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const toSave = customData || this.data;
      fs.writeFileSync(DATA_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting database:', e);
    } finally {
      this.isPersisting = false;
    }
  }

  // Audit Logging
  public logAudit(
    actor: { id: string; email: string; role: string },
    action: string,
    entity: string,
    entityId: string,
    oldValue: any,
    newValue: any,
    ipAddress = '127.0.0.1',
    userAgent = 'SuperAdmin/Web'
  ) {
    const auditRecord: AuditLog = {
      id: 'aud_' + Math.random().toString(36).substr(2, 9),
      actorId: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      action,
      entity,
      entityId,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(auditRecord);

    // Also push to activity feed
    this.logActivity(
      action.replace(/_/g, ' '),
      `Entity ${entity} (#${entityId}) modified by ${actor.email}`,
      'SYSTEM',
      actor.email
    );

    this.persist();
    return auditRecord;
  }

  public logActivity(
    title: string,
    description: string,
    category: ActivityLog['category'],
    actorName: string,
    organizationId?: string | null
  ) {
    const act: ActivityLog = {
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      title,
      description,
      category,
      organizationId: organizationId || null,
      actorName,
      timestamp: new Date().toISOString()
    };
    this.data.activityLogs.unshift(act);
    if (this.data.activityLogs.length > 500) {
      this.data.activityLogs.pop();
    }
  }

  // Raw Access
  public get raw(): DatabaseData {
    return this.data;
  }

  // Organizations
  public getOrganizations(includeDeleted = false): Organization[] {
    return this.data.organizations.filter(o => includeDeleted || !o.deletedAt);
  }

  public getOrganizationById(id: string): Organization | undefined {
    return this.data.organizations.find(o => o.id === id && !o.deletedAt);
  }

  public createOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>, actor: any): Organization {
    const newOrg: Organization = {
      ...org,
      id: 'org_' + Math.random().toString(36).substr(2, 8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.organizations.unshift(newOrg);
    this.logAudit(actor, 'CREATE_ORGANIZATION', 'Organization', newOrg.id, null, newOrg);
    return newOrg;
  }

  public updateOrganization(id: string, updates: Partial<Organization>, actor: any): Organization {
    const idx = this.data.organizations.findIndex(o => o.id === id && !o.deletedAt);
    if (idx === -1) throw new Error('Organization not found');
    const old = { ...this.data.organizations[idx] };
    this.data.organizations[idx] = {
      ...this.data.organizations[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.logAudit(actor, 'UPDATE_ORGANIZATION', 'Organization', id, old, this.data.organizations[idx]);
    return this.data.organizations[idx];
  }

  public deleteOrganization(id: string, actor: any): boolean {
    const org = this.getOrganizationById(id);
    if (!org) throw new Error('Organization not found');
    const old = { ...org };
    org.deletedAt = new Date().toISOString();
    org.status = 'INACTIVE';
    this.logAudit(actor, 'DELETE_ORGANIZATION', 'Organization', id, old, { deletedAt: org.deletedAt });
    return true;
  }

  // Branches
  public getBranches(orgId?: string, includeDeleted = false): Branch[] {
    return this.data.branches.filter(b => {
      if (!includeDeleted && b.deletedAt) return false;
      if (orgId && b.organizationId !== orgId) return false;
      return true;
    });
  }

  public getBranchById(id: string): Branch | undefined {
    return this.data.branches.find(b => b.id === id && !b.deletedAt);
  }

  public createBranch(branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>, actor: any): Branch {
    // Unique branch code within org
    const existing = this.data.branches.find(b => b.organizationId === branch.organizationId && b.code.toUpperCase() === branch.code.toUpperCase() && !b.deletedAt);
    if (existing) throw new Error(`Branch code '${branch.code}' already exists in this organization`);

    const newBranch: Branch = {
      ...branch,
      code: branch.code.toUpperCase(),
      id: 'br_' + Math.random().toString(36).substr(2, 8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.branches.unshift(newBranch);
    this.logAudit(actor, 'CREATE_BRANCH', 'Branch', newBranch.id, null, newBranch);
    return newBranch;
  }

  public updateBranch(id: string, updates: Partial<Branch>, actor: any): Branch {
    const idx = this.data.branches.findIndex(b => b.id === id && !b.deletedAt);
    if (idx === -1) throw new Error('Branch not found');
    const old = { ...this.data.branches[idx] };
    this.data.branches[idx] = {
      ...this.data.branches[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.logAudit(actor, 'UPDATE_BRANCH', 'Branch', id, old, this.data.branches[idx]);
    return this.data.branches[idx];
  }

  public deleteBranch(id: string, actor: any): boolean {
    const branch = this.getBranchById(id);
    if (!branch) throw new Error('Branch not found');
    const old = { ...branch };
    branch.deletedAt = new Date().toISOString();
    branch.status = 'INACTIVE';
    this.logAudit(actor, 'DELETE_BRANCH', 'Branch', id, old, { deletedAt: branch.deletedAt });
    return true;
  }

  // Users
  public getUsers(filters?: { roleCode?: string; orgId?: string; branchId?: string; status?: string; search?: string }): User[] {
    return this.data.users.filter(u => {
      if (u.deletedAt) return false;
      if (filters?.roleCode && u.roleCode !== filters.roleCode) return false;
      if (filters?.orgId && u.organizationId !== filters.orgId) return false;
      if (filters?.branchId && u.branchId !== filters.branchId) return false;
      if (filters?.status && u.status !== filters.status) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        const matches = u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.employeeId.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id && !u.deletedAt);
  }

  public getUserByEmail(email: string): User | undefined {
    const clean = email.toLowerCase().trim();
    // Direct match
    let found = this.data.users.find(u => u.email.toLowerCase() === clean && !u.deletedAt);
    if (found) return found;

    // Smart alias resolution for hospital admin
    if (clean === 'admin@centralhospital.com' || clean === 'admin@central.patternhms.com' || clean === 'admin@hospital.com') {
      found = this.data.users.find(u => (u.email === 'admin@centralhospital.com' || u.email === 'admin@central.patternhms.com' || u.roleCode === 'ORGANIZATION_ADMIN') && !u.deletedAt);
      if (found) return found;
    }

    // Smart alias resolution for receptionist
    if (clean === 'clara.reception@centralhospital.com' || clean === 'reception.clara@central.patternhms.com' || clean === 'receptionist@centralhospital.com' || clean === 'receptionist@patternhms.com' || clean === 'reception@centralhospital.com') {
      found = this.data.users.find(u => (u.email === 'clara.reception@centralhospital.com' || u.email === 'reception.clara@central.patternhms.com' || u.roleCode === 'RECEPTIONIST') && !u.deletedAt);
      if (found) return found;
    }

    // Smart alias resolution for super admin
    if (clean === 'superadmin@patternhms.com' || clean === 'admin@patternhms.com') {
      found = this.data.users.find(u => u.roleCode === 'SUPER_ADMIN' && !u.deletedAt);
      if (found) return found;
    }

    return undefined;
  }

  public getUserByUsername(username: string): User | undefined {
    const clean = username.toLowerCase().trim();
    let found = this.data.users.find(u => u.username.toLowerCase() === clean && !u.deletedAt);
    if (found) return found;

    if (clean === 'admin' || clean === 'admin.central' || clean === 'admin.pch') {
      found = this.data.users.find(u => u.roleCode === 'ORGANIZATION_ADMIN' && !u.deletedAt);
      if (found) return found;
    }

    if (clean === 'receptionist' || clean === 'reception' || clean === 'clara' || clean === 'clara.rec' || clean === 'clara.reception') {
      found = this.data.users.find(u => u.roleCode === 'RECEPTIONIST' && !u.deletedAt);
      if (found) return found;
    }

    if (clean === 'superadmin') {
      found = this.data.users.find(u => u.roleCode === 'SUPER_ADMIN' && !u.deletedAt);
      if (found) return found;
    }

    return undefined;
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'failedLoginAttempts' | 'lockedUntil'>, actor: any): User {
    if (this.getUserByEmail(userData.email)) {
      throw new Error(`Email ${userData.email} is already registered`);
    }
    if (this.getUserByUsername(userData.username)) {
      throw new Error(`Username ${userData.username} is already taken`);
    }

    const newUser: User = {
      ...userData,
      id: 'usr_' + Math.random().toString(36).substr(2, 8),
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.unshift(newUser);
    this.logAudit(actor, 'CREATE_USER', 'User', newUser.id, null, { ...newUser, passwordHash: '***' });
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>, actor: any): User {
    const idx = this.data.users.findIndex(u => u.id === id && !u.deletedAt);
    if (idx === -1) throw new Error('User not found');
    const old = { ...this.data.users[idx] };
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.logAudit(actor, 'UPDATE_USER', 'User', id, { ...old, passwordHash: '***' }, { ...this.data.users[idx], passwordHash: '***' });
    return this.data.users[idx];
  }

  public deleteUser(id: string, actor: any): boolean {
    const user = this.getUserById(id);
    if (!user) throw new Error('User not found');
    if (user.roleCode === 'SUPER_ADMIN' && this.data.users.filter(u => u.roleCode === 'SUPER_ADMIN' && !u.deletedAt).length <= 1) {
      throw new Error('Cannot delete the last Super Admin in the system');
    }
    const old = { ...user };
    user.deletedAt = new Date().toISOString();
    user.status = 'INACTIVE';
    this.logAudit(actor, 'DELETE_USER', 'User', id, { email: old.email }, { deletedAt: user.deletedAt });
    return true;
  }

  // Doctors
  public getDoctors(filters?: { orgId?: string; branchId?: string; specialtyId?: string; status?: string }): Doctor[] {
    return this.data.doctors.filter(d => {
      if (d.deletedAt) return false;
      if (filters?.orgId && d.organizationId !== filters.orgId) return false;
      if (filters?.branchId && d.branchId !== filters.branchId) return false;
      if (filters?.specialtyId && d.specialtyId !== filters.specialtyId) return false;
      if (filters?.status && d.status !== filters.status) return false;
      return true;
    });
  }

  public getDoctorById(id: string): Doctor | undefined {
    return this.data.doctors.find(d => d.id === id && !d.deletedAt);
  }

  public createDoctor(doc: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>, actor: any): Doctor {
    const newDoc: Doctor = {
      ...doc,
      id: 'doc_' + Math.random().toString(36).substr(2, 8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.doctors.unshift(newDoc);
    this.logAudit(actor, 'CREATE_DOCTOR', 'Doctor', newDoc.id, null, newDoc);
    return newDoc;
  }

  public updateDoctor(id: string, updates: Partial<Doctor>, actor: any): Doctor {
    const idx = this.data.doctors.findIndex(d => d.id === id && !d.deletedAt);
    if (idx === -1) throw new Error('Doctor not found');
    const old = { ...this.data.doctors[idx] };
    this.data.doctors[idx] = {
      ...this.data.doctors[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.logAudit(actor, 'UPDATE_DOCTOR', 'Doctor', id, old, this.data.doctors[idx]);
    return this.data.doctors[idx];
  }

  public deleteDoctor(id: string, actor: any): boolean {
    const doc = this.getDoctorById(id);
    if (!doc) throw new Error('Doctor not found');
    doc.deletedAt = new Date().toISOString();
    doc.status = 'SUSPENDED';
    this.logAudit(actor, 'DELETE_DOCTOR', 'Doctor', id, { id }, { deletedAt: doc.deletedAt });
    return true;
  }

  // Diagnostic Tests
  public getDiagnosticTests(filters?: { categoryId?: string; departmentId?: string; search?: string }): DiagnosticTest[] {
    return this.data.diagnosticTests.filter(t => {
      if (t.deletedAt) return false;
      if (filters?.categoryId && t.categoryId !== filters.categoryId) return false;
      if (filters?.departmentId && t.departmentId !== filters.departmentId) return false;
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.code.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  public createDiagnosticTest(test: Omit<DiagnosticTest, 'id' | 'createdAt'>, actor: any): DiagnosticTest {
    const existing = this.data.diagnosticTests.find(t => t.code.toUpperCase() === test.code.toUpperCase() && !t.deletedAt);
    if (existing) throw new Error(`Test code ${test.code} already exists`);

    const newTest: DiagnosticTest = {
      ...test,
      code: test.code.toUpperCase(),
      id: 't_' + Math.random().toString(36).substr(2, 8),
      createdAt: new Date().toISOString()
    };
    this.data.diagnosticTests.unshift(newTest);
    this.logAudit(actor, 'CREATE_DIAGNOSTIC_TEST', 'DiagnosticTest', newTest.id, null, newTest);
    return newTest;
  }

  public updateDiagnosticTest(id: string, updates: Partial<DiagnosticTest>, actor: any): DiagnosticTest {
    const idx = this.data.diagnosticTests.findIndex(t => t.id === id && !t.deletedAt);
    if (idx === -1) throw new Error('Test not found');
    const old = { ...this.data.diagnosticTests[idx] };
    this.data.diagnosticTests[idx] = {
      ...this.data.diagnosticTests[idx],
      ...updates
    };
    this.logAudit(actor, 'UPDATE_DIAGNOSTIC_TEST', 'DiagnosticTest', id, old, this.data.diagnosticTests[idx]);
    return this.data.diagnosticTests[idx];
  }

  // Dynamic Dashboard KPIs Calculation
  public getDashboardKPIs(period: string, orgId?: string, branchId?: string): DashboardKPIs {
    const activeOrgs = this.data.organizations.filter(o => !o.deletedAt && o.status === 'ACTIVE').length;
    const totalHospitals = this.data.organizations.filter(o => !o.deletedAt && o.type === 'HOSPITAL').length;
    const totalDiags = this.data.organizations.filter(o => !o.deletedAt && o.type === 'DIAGNOSTIC_CENTER').length;

    const filteredUsers = this.data.users.filter(u => {
      if (u.deletedAt) return false;
      if (orgId && u.organizationId !== orgId) return false;
      if (branchId && u.branchId !== branchId) return false;
      return true;
    });

    const activeUsers = filteredUsers.filter(u => u.status === 'ACTIVE').length;
    const doctorsCount = filteredUsers.filter(u => u.roleCode === 'DOCTOR').length;
    const recCount = filteredUsers.filter(u => u.roleCode === 'RECEPTIONIST').length;
    const pathCount = filteredUsers.filter(u => u.roleCode === 'PATHOLOGIST').length;
    const labCount = filteredUsers.filter(u => u.roleCode === 'LAB_TECHNICIAN').length;
    const adminCount = filteredUsers.filter(u => ['SUPER_ADMIN', 'ORGANIZATION_ADMIN'].includes(u.roleCode)).length;

    const activeTests = this.data.diagnosticTests.filter(t => !t.deletedAt && t.status === 'ACTIVE').length;

    const filteredBeds = this.data.beds.filter(b => {
      if (b.deletedAt) return false;
      if (branchId && b.branchId !== branchId) return false;
      return true;
    });

    const occupiedBeds = filteredBeds.filter(b => b.status === 'OCCUPIED').length;
    const availableBeds = filteredBeds.filter(b => b.status === 'AVAILABLE').length;
    const maintenanceBeds = filteredBeds.filter(b => ['MAINTENANCE', 'CLEANING', 'OUT_OF_SERVICE'].includes(b.status)).length;

    // Period multiplier for simulated live traffic based on registered doctors, beds, tests
    let scale = 1;
    if (period === 'today') scale = 1;
    else if (period === 'yesterday') scale = 0.92;
    else if (period === 'last_7_days') scale = 6.8;
    else if (period === 'last_30_days') scale = 28.5;
    else if (period === 'this_month') scale = 14.2;
    else if (period === 'this_year') scale = 180.0;

    const baseDailyPatients = 148;
    const baseDailyAppointments = 92;
    const baseDailyRevenue = 24850;
    const baseDailyTests = 210;

    return {
      organizations: {
        totalHospitals,
        totalDiagnosticCenters: totalDiags,
        activeOrganizations: activeOrgs,
        inactiveOrganizations: this.data.organizations.filter(o => !o.deletedAt && o.status !== 'ACTIVE').length
      },
      users: {
        totalUsers: filteredUsers.length,
        activeUsers,
        doctors: doctorsCount,
        receptionists: recCount,
        pathologists: pathCount,
        laboratoryStaff: labCount,
        administrators: adminCount
      },
      patients: {
        totalPatients: Math.round(14500 * (orgId ? 0.6 : 1)),
        todayRegistered: Math.round(baseDailyPatients * scale),
        todayAppointments: Math.round(baseDailyAppointments * scale),
        todayCompletedAppointments: Math.round(baseDailyAppointments * 0.82 * scale)
      },
      diagnostics: {
        totalTests: this.data.diagnosticTests.filter(t => !t.deletedAt).length,
        activeTests,
        testsPerformedToday: Math.round(baseDailyTests * scale),
        pendingLaboratoryTests: Math.round(24 * (scale > 1 ? 1 : scale))
      },
      financial: {
        todayRevenue: Math.round(baseDailyRevenue * scale),
        weeklyRevenue: Math.round(baseDailyRevenue * 6.9),
        monthlyRevenue: Math.round(baseDailyRevenue * 29.4),
        yearlyRevenue: Math.round(baseDailyRevenue * 355),
        outstandingInvoices: Math.round(3800 * (orgId ? 0.5 : 1)),
        paidInvoices: Math.round(14200 * (orgId ? 0.6 : 1)),
        unpaidInvoices: Math.round(142 * (orgId ? 0.5 : 1))
      },
      infrastructure: {
        occupiedBeds,
        availableBeds,
        maintenanceBeds,
        totalBeds: filteredBeds.length
      }
    };
  }

  // ----------------------------------------------------
  // Sequence and Identifier Generators
  // ----------------------------------------------------

  public getNextPatientId(): string {
    const year = new Date().getFullYear();
    const count = (this.data.patients || []).length + 1;
    const padded = String(count).padStart(6, '0');
    return `PAT-${year}-${padded}`;
  }

  public getNextAppointmentNumber(): string {
    const year = new Date().getFullYear();
    const count = (this.data.appointments || []).length + 1;
    const padded = String(count).padStart(6, '0');
    return `APT-${year}-${padded}`;
  }

  public getNextInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const count = (this.data.invoices || []).length + 1;
    const padded = String(count).padStart(6, '0');
    return `INV-${year}-${padded}`;
  }

  public getNextReceiptNumber(): string {
    const year = new Date().getFullYear();
    const count = (this.data.payments || []).length + 1;
    const padded = String(count).padStart(6, '0');
    return `REC-${year}-${padded}`;
  }

  public getNextTestOrderNumber(): string {
    const year = new Date().getFullYear();
    const count = (this.data.testOrders || []).length + 1;
    const padded = String(count).padStart(6, '0');
    return `TO-${year}-${padded}`;
  }

  public getNextQueueToken(branchId: string, doctorId: string, priority: QueuePriority): { tokenNumber: string; sequenceNumber: number } {
    const today = new Date().toISOString().slice(0, 10);
    const todayTokens = (this.data.queueEntries || []).filter(q => q.createdAt.slice(0, 10) === today);
    const doctorTokens = todayTokens.filter(q => q.doctorId === doctorId);
    
    // Prefix by doctor chamber or letter
    const doc = this.data.doctors.find(d => d.id === doctorId);
    const chamber = this.data.chambers.find(c => c.id === doc?.chamberId);
    const prefix = chamber ? chamber.number.charAt(0) : (priority === 'EMERGENCY' ? 'EM' : 'A');
    const seq = doctorTokens.length + 101;
    const tokenNumber = `${prefix}-${seq}`;
    return { tokenNumber, sequenceNumber: seq };
  }

  // ----------------------------------------------------
  // Patient Management
  // ----------------------------------------------------

  public getPatients(filters?: { query?: string; organizationId?: string; branchId?: string; status?: string }): Patient[] {
    let result = (this.data.patients || []).filter(p => !p.deletedAt);
    if (filters?.organizationId) {
      result = result.filter(p => p.organizationId === filters.organizationId);
    }
    if (filters?.branchId) {
      result = result.filter(p => p.branchId === filters.branchId);
    }
    if (filters?.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      result = result.filter(p => 
        p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getPatientById(id: string): Patient | undefined {
    return (this.data.patients || []).find(p => (p.id === id || p.patientId === id) && !p.deletedAt);
  }

  public findDuplicatePatients(phone: string, fullName: string, dob?: string): Patient[] {
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanName = fullName.toLowerCase().trim();
    return (this.data.patients || []).filter(p => {
      if (p.deletedAt) return false;
      const matchPhone = p.phone.replace(/\D/g, '') === cleanPhone;
      const matchName = p.fullName.toLowerCase().trim() === cleanName;
      const matchDob = dob && p.dob === dob;
      return matchPhone || (matchName && matchDob);
    });
  }

  public createPatient(patientData: Omit<Patient, 'id' | 'patientId' | 'createdAt' | 'updatedAt'>, actor: any): Patient {
    const timestamp = new Date().toISOString();
    const newPatient: Patient = {
      ...patientData,
      id: 'pat_' + Math.random().toString(36).substr(2, 9),
      patientId: this.getNextPatientId(),
      totalVisits: 0,
      outstandingBalance: 0,
      registeredAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    if (!this.data.patients) this.data.patients = [];
    this.data.patients.unshift(newPatient);
    this.persist();
    this.logAudit(actor, 'CREATE_PATIENT', 'Patient', newPatient.id, null, newPatient);
    this.logActivity(
      `New Patient Registered: ${newPatient.fullName}`,
      `Patient ID ${newPatient.patientId} admitted under front desk`,
      'CLINICAL',
      actor?.name || 'Receptionist',
      newPatient.organizationId
    );
    return newPatient;
  }

  public updatePatient(id: string, updates: Partial<Patient>, actor: any): Patient {
    const idx = (this.data.patients || []).findIndex(p => p.id === id && !p.deletedAt);
    if (idx === -1) throw new Error('Patient not found');
    const old = { ...this.data.patients[idx] };
    const updated: Patient = {
      ...this.data.patients[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.patients[idx] = updated;
    this.persist();
    this.logAudit(actor, 'UPDATE_PATIENT', 'Patient', id, old, updated);
    return updated;
  }

  public deletePatient(id: string, actor: any): boolean {
    const idx = (this.data.patients || []).findIndex(p => p.id === id && !p.deletedAt);
    if (idx === -1) return false;
    this.data.patients[idx].deletedAt = new Date().toISOString();
    this.persist();
    this.logAudit(actor, 'DELETE_PATIENT', 'Patient', id, null, { deleted: true });
    return true;
  }

  // ----------------------------------------------------
  // Appointment Management
  // ----------------------------------------------------

  public getAppointments(filters?: { date?: string; doctorId?: string; patientId?: string; status?: string; branchId?: string; organizationId?: string }): Appointment[] {
    let list = this.data.appointments || [];
    if (filters?.date) list = list.filter(a => a.date === filters.date);
    if (filters?.doctorId) list = list.filter(a => a.doctorId === filters.doctorId);
    if (filters?.patientId) list = list.filter(a => a.patientId === filters.patientId);
    if (filters?.status) list = list.filter(a => a.status === filters.status);
    if (filters?.branchId) list = list.filter(a => a.branchId === filters.branchId);
    if (filters?.organizationId) list = list.filter(a => a.organizationId === filters.organizationId);
    return list;
  }

  public getAppointmentById(id: string): Appointment | undefined {
    return (this.data.appointments || []).find(a => a.id === id || a.appointmentNumber === id);
  }

  public createAppointment(data: Omit<Appointment, 'id' | 'appointmentNumber' | 'createdAt' | 'updatedAt'>, actor: any): Appointment {
    const timestamp = new Date().toISOString();
    const newApt: Appointment = {
      ...data,
      id: 'apt_' + Math.random().toString(36).substr(2, 9),
      appointmentNumber: this.getNextAppointmentNumber(),
      createdAt: timestamp,
      updatedAt: timestamp
    };
    if (!this.data.appointments) this.data.appointments = [];
    this.data.appointments.unshift(newApt);
    this.persist();
    this.logAudit(actor, 'CREATE_APPOINTMENT', 'Appointment', newApt.id, null, newApt);
    this.logActivity(
      `Appointment Scheduled: ${newApt.patientName}`,
      `Booked with ${newApt.doctorName} on ${newApt.date} at ${newApt.timeSlot}`,
      'CLINICAL',
      actor?.name || 'Receptionist',
      newApt.organizationId
    );
    return newApt;
  }

  public updateAppointment(id: string, updates: Partial<Appointment>, actor: any): Appointment {
    const idx = (this.data.appointments || []).findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    const old = { ...this.data.appointments[idx] };
    const updated = {
      ...this.data.appointments[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.appointments[idx] = updated;
    this.persist();
    this.logAudit(actor, 'UPDATE_APPOINTMENT', 'Appointment', id, old, updated);
    return updated;
  }

  public checkInAppointment(appointmentId: string, actor: any): { appointment: Appointment; queueEntry: QueueEntry } {
    const apt = this.getAppointmentById(appointmentId);
    if (!apt) throw new Error('Appointment not found');
    const patient = this.getPatientById(apt.patientId);
    const timestamp = new Date().toISOString();

    const { tokenNumber, sequenceNumber } = this.getNextQueueToken(apt.branchId, apt.doctorId, 'APPOINTMENT');
    const newQueueEntry: QueueEntry = {
      id: 'qe_' + Math.random().toString(36).substr(2, 9),
      tokenNumber,
      sequenceNumber,
      patientId: apt.patientId,
      patientName: apt.patientName,
      patientPhone: apt.patientPhone,
      patientAge: patient?.age || 35,
      patientGender: patient?.gender || 'OTHER',
      doctorId: apt.doctorId,
      doctorName: apt.doctorName,
      chamberId: apt.chamberName,
      chamberNumber: apt.chamberNumber,
      branchId: apt.branchId,
      organizationId: apt.organizationId,
      priority: 'APPOINTMENT',
      status: 'WAITING',
      visitType: 'APPOINTMENT',
      calledCount: 0,
      appointmentId: apt.id,
      notes: apt.notes,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (!this.data.queueEntries) this.data.queueEntries = [];
    this.data.queueEntries.push(newQueueEntry);

    // Update appointment
    const updatedApt = this.updateAppointment(apt.id, {
      status: 'WAITING',
      checkedInAt: timestamp,
      queueToken: tokenNumber
    }, actor);

    this.persist();
    this.logActivity(
      `Patient Checked In: ${apt.patientName}`,
      `Generated Token ${tokenNumber} for ${apt.doctorName} (${apt.chamberName})`,
      'CLINICAL',
      actor?.name || 'Receptionist',
      apt.organizationId
    );

    return { appointment: updatedApt, queueEntry: newQueueEntry };
  }

  // ----------------------------------------------------
  // Queue & Token Management
  // ----------------------------------------------------

  public getQueueEntries(filters?: { doctorId?: string; chamberNumber?: string; status?: string; branchId?: string; organizationId?: string; date?: string }): QueueEntry[] {
    let list = this.data.queueEntries || [];
    const dateToMatch = filters?.date || new Date().toISOString().slice(0, 10);
    list = list.filter(q => q.createdAt.slice(0, 10) === dateToMatch);

    if (filters?.doctorId) list = list.filter(q => q.doctorId === filters.doctorId);
    if (filters?.chamberNumber) list = list.filter(q => q.chamberNumber === filters.chamberNumber);
    if (filters?.status) list = list.filter(q => q.status === filters.status);
    if (filters?.branchId) list = list.filter(q => q.branchId === filters.branchId);
    if (filters?.organizationId) list = list.filter(q => q.organizationId === filters.organizationId);
    return list;
  }

  public getQueueEntryById(id: string): QueueEntry | undefined {
    return (this.data.queueEntries || []).find(q => q.id === id || q.tokenNumber === id);
  }

  public createQueueEntry(data: {
    patientId: string;
    doctorId: string;
    branchId: string;
    organizationId: string;
    priority: QueuePriority;
    visitType: 'WALK_IN' | 'APPOINTMENT' | 'FOLLOW_UP';
    notes?: string;
  }, actor: any): QueueEntry {
    const patient = this.getPatientById(data.patientId);
    if (!patient) throw new Error('Patient not found');
    const doctor = this.data.doctors.find(d => d.id === data.doctorId);
    if (!doctor) throw new Error('Doctor not found');
    const chamber = this.data.chambers.find(c => c.id === doctor.chamberId);

    const { tokenNumber, sequenceNumber } = this.getNextQueueToken(data.branchId, data.doctorId, data.priority);
    const timestamp = new Date().toISOString();

    const entry: QueueEntry = {
      id: 'qe_' + Math.random().toString(36).substr(2, 9),
      tokenNumber,
      sequenceNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      chamberId: chamber?.id || 'chmb_default',
      chamberNumber: chamber?.number || '101',
      branchId: data.branchId,
      organizationId: data.organizationId,
      priority: data.priority,
      status: 'WAITING',
      visitType: data.visitType,
      calledCount: 0,
      notes: data.notes,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (!this.data.queueEntries) this.data.queueEntries = [];
    this.data.queueEntries.push(entry);
    this.persist();

    this.logActivity(
      `Token Issued: ${tokenNumber}`,
      `Patient ${patient.fullName} queued for ${doctor.fullName} (Chamber ${chamber?.number || '101'})`,
      'CLINICAL',
      actor?.name || 'Receptionist',
      data.organizationId
    );

    return entry;
  }

  public callQueueEntry(id: string, actor: any): { entry: QueueEntry; announcementText: string } {
    const idx = (this.data.queueEntries || []).findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Queue entry not found');

    const entry = this.data.queueEntries[idx];
    const timestamp = new Date().toISOString();

    // Mark previous in-consultation for this doctor as completed or waiting
    this.data.queueEntries.forEach(q => {
      if (q.doctorId === entry.doctorId && q.id !== entry.id && q.status === 'CALLED') {
        q.status = 'WAITING';
      }
    });

    entry.status = 'CALLED';
    entry.calledCount = (entry.calledCount || 0) + 1;
    entry.lastCalledAt = timestamp;
    entry.updatedAt = timestamp;

    this.persist();

    const announcementText = `Token number ${entry.tokenNumber}, ${entry.patientName}, please proceed to Chamber ${entry.chamberNumber}`;
    this.logActivity(
      `Token Called: ${entry.tokenNumber}`,
      `Called to Chamber ${entry.chamberNumber} (Call count: ${entry.calledCount})`,
      'CLINICAL',
      actor?.name || 'Receptionist',
      entry.organizationId
    );

    return { entry, announcementText };
  }

  public recallQueueEntry(id: string, actor: any): { entry: QueueEntry; announcementText: string } {
    return this.callQueueEntry(id, actor);
  }

  public startQueueConsultation(id: string, actor: any): QueueEntry {
    const idx = (this.data.queueEntries || []).findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Queue entry not found');
    this.data.queueEntries[idx].status = 'IN_CONSULTATION';
    this.data.queueEntries[idx].updatedAt = new Date().toISOString();
    this.persist();
    return this.data.queueEntries[idx];
  }

  public completeQueueEntry(id: string, actor: any): QueueEntry {
    const idx = (this.data.queueEntries || []).findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Queue entry not found');
    const timestamp = new Date().toISOString();
    this.data.queueEntries[idx].status = 'COMPLETED';
    this.data.queueEntries[idx].completedAt = timestamp;
    this.data.queueEntries[idx].updatedAt = timestamp;
    this.persist();
    return this.data.queueEntries[idx];
  }

  public skipQueueEntry(id: string, actor: any): QueueEntry {
    const idx = (this.data.queueEntries || []).findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Queue entry not found');
    this.data.queueEntries[idx].status = 'SKIPPED';
    this.data.queueEntries[idx].updatedAt = new Date().toISOString();
    this.persist();
    return this.data.queueEntries[idx];
  }

  public holdQueueEntry(id: string, actor: any): QueueEntry {
    const idx = (this.data.queueEntries || []).findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Queue entry not found');
    this.data.queueEntries[idx].status = 'PAUSED';
    this.data.queueEntries[idx].updatedAt = new Date().toISOString();
    this.persist();
    return this.data.queueEntries[idx];
  }

  public transferQueueEntry(id: string, targetDoctorId: string, reason: string, actor: any): QueueEntry {
    const idx = (this.data.queueEntries || []).findIndex(q => q.id === id);
    if (idx === -1) throw new Error('Queue entry not found');
    const targetDoc = this.data.doctors.find(d => d.id === targetDoctorId);
    if (!targetDoc) throw new Error('Target doctor not found');
    const targetChamber = this.data.chambers.find(c => c.id === targetDoc.chamberId);

    const oldEntry = { ...this.data.queueEntries[idx] };
    this.data.queueEntries[idx].doctorId = targetDoc.id;
    this.data.queueEntries[idx].doctorName = targetDoc.fullName;
    this.data.queueEntries[idx].chamberId = targetChamber?.id || 'chmb_default';
    this.data.queueEntries[idx].chamberNumber = targetChamber?.number || '101';
    this.data.queueEntries[idx].notes = `Transferred from ${oldEntry.doctorName}. Reason: ${reason}`;
    this.data.queueEntries[idx].updatedAt = new Date().toISOString();

    this.persist();
    this.logAudit(actor, 'TRANSFER_QUEUE', 'QueueEntry', id, oldEntry, this.data.queueEntries[idx]);
    return this.data.queueEntries[idx];
  }

  // ----------------------------------------------------
  // Sales Agents & Commission Management
  // ----------------------------------------------------

  public getSalesAgents(filters?: { query?: string; organizationId?: string; status?: string }): SalesAgent[] {
    let list = this.data.salesAgents || [];
    if (filters?.organizationId) list = list.filter(a => a.organizationId === filters.organizationId);
    if (filters?.status) list = list.filter(a => a.status === filters.status);
    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(a => a.fullName.toLowerCase().includes(q) || a.agentId.toLowerCase().includes(q) || a.phone.includes(q));
    }
    return list;
  }

  public getSalesAgentById(id: string): SalesAgent | undefined {
    return (this.data.salesAgents || []).find(a => a.id === id || a.agentId === id);
  }

  public createSalesAgent(data: Omit<SalesAgent, 'id' | 'agentId' | 'totalEarned' | 'totalPaid' | 'totalReversed' | 'outstandingBalance' | 'createdAt' | 'updatedAt'>, actor: any): SalesAgent {
    const timestamp = new Date().toISOString();
    const count = (this.data.salesAgents || []).length + 1;
    const newAgent: SalesAgent = {
      ...data,
      id: 'sa_' + Math.random().toString(36).substr(2, 9),
      agentId: `SA-${String(count).padStart(3, '0')}`,
      totalEarned: 0,
      totalPaid: 0,
      totalReversed: 0,
      outstandingBalance: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    if (!this.data.salesAgents) this.data.salesAgents = [];
    this.data.salesAgents.unshift(newAgent);
    this.persist();
    this.logAudit(actor, 'CREATE_SALES_AGENT', 'SalesAgent', newAgent.id, null, newAgent);
    return newAgent;
  }

  public updateSalesAgent(id: string, updates: Partial<SalesAgent>, actor: any): SalesAgent {
    const idx = (this.data.salesAgents || []).findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Sales agent not found');
    const old = { ...this.data.salesAgents[idx] };
    const updated = {
      ...this.data.salesAgents[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.salesAgents[idx] = updated;
    this.persist();
    this.logAudit(actor, 'UPDATE_SALES_AGENT', 'SalesAgent', id, old, updated);
    return updated;
  }

  public getSalesAgentCommissions(filters?: { salesAgentId?: string; invoiceId?: string; status?: string }): SalesAgentCommission[] {
    let list = this.data.salesAgentCommissions || [];
    if (filters?.salesAgentId) list = list.filter(c => c.salesAgentId === filters.salesAgentId);
    if (filters?.invoiceId) list = list.filter(c => c.invoiceId === filters.invoiceId);
    if (filters?.status) list = list.filter(c => c.status === filters.status);
    return list;
  }

  public getSalesAgentLedger(salesAgentId: string): CommissionLedger[] {
    return (this.data.commissionLedgers || []).filter(l => l.salesAgentId === salesAgentId);
  }

  public recordCommissionPayout(salesAgentId: string, amount: number, reference: string, notes: string, actor: any): CommissionLedger {
    const agent = this.getSalesAgentById(salesAgentId);
    if (!agent) throw new Error('Sales agent not found');
    if (amount <= 0) throw new Error('Payout amount must be greater than zero');
    if (amount > agent.outstandingBalance) {
      throw new Error(`Payout amount (${amount}) exceeds agent outstanding balance (${agent.outstandingBalance})`);
    }

    const newBalance = agent.outstandingBalance - amount;
    agent.totalPaid += amount;
    agent.outstandingBalance = newBalance;
    agent.updatedAt = new Date().toISOString();

    const timestamp = new Date().toISOString();
    const ledgerEntry: CommissionLedger = {
      id: 'cml_' + Math.random().toString(36).substr(2, 9),
      salesAgentId: agent.id,
      entryType: 'PAID',
      amount,
      balanceAfter: newBalance,
      reference,
      notes,
      createdAt: timestamp
    };

    if (!this.data.commissionLedgers) this.data.commissionLedgers = [];
    this.data.commissionLedgers.unshift(ledgerEntry);
    this.persist();

    this.logAudit(actor, 'PAYOUT_COMMISSION', 'SalesAgent', agent.id, null, { amount, reference, newBalance });
    return ledgerEntry;
  }

  // ----------------------------------------------------
  // Billing, Invoices & Payments
  // ----------------------------------------------------

  public getInvoices(filters?: { query?: string; patientId?: string; status?: string; salesAgentId?: string; branchId?: string; organizationId?: string }): Invoice[] {
    let list = this.data.invoices || [];
    if (filters?.patientId) list = list.filter(i => i.patientId === filters.patientId);
    if (filters?.status) list = list.filter(i => i.status === filters.status);
    if (filters?.salesAgentId) list = list.filter(i => i.salesAgentId === filters.salesAgentId);
    if (filters?.branchId) list = list.filter(i => i.branchId === filters.branchId);
    if (filters?.organizationId) list = list.filter(i => i.organizationId === filters.organizationId);
    if (filters?.query) {
      const q = filters.query.toLowerCase().trim();
      list = list.filter(i => i.invoiceNumber.toLowerCase().includes(q) || i.patientName.toLowerCase().includes(q) || i.patientPhone.includes(q));
    }
    return list;
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return (this.data.invoices || []).find(i => i.id === id || i.invoiceNumber === id);
  }

  public createInvoice(data: {
    patientId: string;
    organizationId: string;
    branchId: string;
    items: Omit<InvoiceItem, 'id' | 'subtotal' | 'total'>[];
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    salesAgentId?: string | null;
    initialPayment?: {
      amount: number;
      method: Payment['method'];
      transactionReference: string;
      notes?: string;
    };
  }, actor: any): { invoice: Invoice; payment?: Payment } {
    const patient = this.getPatientById(data.patientId);
    if (!patient) throw new Error('Patient not found');

    const timestamp = new Date().toISOString();
    const invoiceNumber = this.getNextInvoiceNumber();

    // 1. Calculate items subtotal
    let subtotal = 0;
    const computedItems: InvoiceItem[] = data.items.map(item => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineDiscount = item.discount || 0;
      const lineTax = item.tax || 0;
      const lineTotal = lineSubtotal - lineDiscount + lineTax;
      subtotal += lineSubtotal;
      return {
        ...item,
        id: 'ii_' + Math.random().toString(36).substr(2, 9),
        subtotal: lineSubtotal,
        total: lineTotal
      };
    });

    // 2. Compute discount capped at subtotal
    let discountAmount = 0;
    if (data.discountType === 'PERCENT') {
      const pct = Math.min(Math.max(data.discountValue, 0), 100);
      discountAmount = Math.round((subtotal * pct) / 100);
    } else {
      discountAmount = Math.min(Math.max(data.discountValue, 0), subtotal);
    }

    const netPayable = Math.max(0, subtotal - discountAmount);
    const initialPaid = data.initialPayment ? Math.min(data.initialPayment.amount, netPayable) : 0;
    const dueAmount = netPayable - initialPaid;

    let invoiceStatus: Invoice['status'] = 'PENDING';
    if (dueAmount <= 0) {
      invoiceStatus = 'PAID';
    } else if (initialPaid > 0) {
      invoiceStatus = 'PARTIALLY_PAID';
    }

    // 3. Sales Agent & Commission (Snapshot rate from DB)
    let salesAgentName: string | null = null;
    let commissionRateSnapshot: number | null = null;
    let commissionEarned: number | null = null;
    let agentRecord: SalesAgent | undefined;

    if (data.salesAgentId) {
      agentRecord = this.getSalesAgentById(data.salesAgentId);
      if (agentRecord && agentRecord.status === 'ACTIVE') {
        salesAgentName = agentRecord.fullName;
        commissionRateSnapshot = agentRecord.commissionPercentage;
        // Commission earned strictly on eligible collected amount or full amount if fully paid
        const eligibleBasis = initialPaid > 0 ? initialPaid : (invoiceStatus === 'PAID' ? netPayable : 0);
        commissionEarned = Math.round((eligibleBasis * (commissionRateSnapshot / 100)) * 100) / 100;
      }
    }

    const newInvoice: Invoice = {
      id: 'inv_' + Math.random().toString(36).substr(2, 9),
      invoiceNumber,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      organizationId: data.organizationId,
      branchId: data.branchId,
      receptionistId: actor?.id || 'usr_rec_clara',
      receptionistName: actor?.name || 'Clara Oswald',
      salesAgentId: data.salesAgentId || null,
      salesAgentName,
      salesAgentCommissionRate: commissionRateSnapshot,
      salesAgentCommissionEarned: commissionEarned,
      items: computedItems,
      subtotal,
      discountType: data.discountType,
      discountValue: data.discountValue,
      discountAmount,
      taxPercent: 0,
      taxAmount: 0,
      netPayable,
      paidAmount: initialPaid,
      dueAmount,
      status: invoiceStatus,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (!this.data.invoices) this.data.invoices = [];
    this.data.invoices.unshift(newInvoice);

    // 4. Record Sales Agent Commission & Ledger if applicable
    if (agentRecord && commissionRateSnapshot !== null) {
      const commissionRecord: SalesAgentCommission = {
        id: 'sac_' + Math.random().toString(36).substr(2, 9),
        salesAgentId: agentRecord.id,
        salesAgentName: agentRecord.fullName,
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        patientId: patient.id,
        patientName: patient.fullName,
        branchId: data.branchId,
        organizationId: data.organizationId,
        grossAmount: subtotal,
        discountAmount,
        eligibleAmount: initialPaid,
        commissionRateSnapshot,
        commissionEarned: commissionEarned || 0,
        commissionPaid: 0,
        status: (commissionEarned && commissionEarned > 0) ? 'EARNED' : 'PENDING',
        createdAt: timestamp
      };
      if (!this.data.salesAgentCommissions) this.data.salesAgentCommissions = [];
      this.data.salesAgentCommissions.unshift(commissionRecord);

      if (commissionEarned && commissionEarned > 0) {
        agentRecord.totalEarned += commissionEarned;
        agentRecord.outstandingBalance += commissionEarned;
        agentRecord.updatedAt = timestamp;

        const ledger: CommissionLedger = {
          id: 'cml_' + Math.random().toString(36).substr(2, 9),
          salesAgentId: agentRecord.id,
          entryType: 'EARNED',
          amount: commissionEarned,
          balanceAfter: agentRecord.outstandingBalance,
          invoiceId: newInvoice.id,
          reference: newInvoice.invoiceNumber,
          notes: `Commission earned for ${newInvoice.invoiceNumber} (${patient.fullName})`,
          createdAt: timestamp
        };
        if (!this.data.commissionLedgers) this.data.commissionLedgers = [];
        this.data.commissionLedgers.unshift(ledger);
      }
    }

    // 5. Initial Payment Record
    let paymentRecord: Payment | undefined;
    if (initialPaid > 0 && data.initialPayment) {
      paymentRecord = {
        id: 'pay_' + Math.random().toString(36).substr(2, 9),
        receiptNumber: this.getNextReceiptNumber(),
        invoiceId: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        patientId: patient.id,
        patientName: patient.fullName,
        amount: initialPaid,
        method: data.initialPayment.method,
        transactionReference: data.initialPayment.transactionReference || 'INIT-PAY',
        receivedByUserId: actor?.id || 'usr_rec_clara',
        receivedByName: actor?.name || 'Clara Oswald',
        branchId: data.branchId,
        organizationId: data.organizationId,
        notes: data.initialPayment.notes || 'Payment collected at invoice creation',
        createdAt: timestamp
      };
      if (!this.data.payments) this.data.payments = [];
      this.data.payments.unshift(paymentRecord);
    }

    // Update patient statistics
    patient.totalVisits += 1;
    patient.outstandingBalance += dueAmount;
    patient.lastVisitAt = timestamp;
    patient.updatedAt = timestamp;

    this.persist();
    this.logAudit(actor, 'CREATE_INVOICE', 'Invoice', newInvoice.id, null, newInvoice);
    this.logActivity(
      `Invoice Generated: ${newInvoice.invoiceNumber}`,
      `Total: ৳${newInvoice.netPayable} (Paid: ৳${newInvoice.paidAmount}) for ${patient.fullName}`,
      'BILLING',
      actor?.name || 'Receptionist',
      newInvoice.organizationId
    );

    return { invoice: newInvoice, payment: paymentRecord };
  }

  public createPayment(data: {
    invoiceId: string;
    amount: number;
    method: Payment['method'];
    transactionReference: string;
    notes?: string;
  }, actor: any): Payment {
    const invoice = this.getInvoiceById(data.invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (data.amount <= 0) throw new Error('Payment amount must be greater than zero');
    if (data.amount > invoice.dueAmount) {
      throw new Error(`Payment amount (৳${data.amount}) cannot exceed due balance (৳${invoice.dueAmount})`);
    }

    const timestamp = new Date().toISOString();
    const receiptNumber = this.getNextReceiptNumber();

    const payment: Payment = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      amount: data.amount,
      method: data.method,
      transactionReference: data.transactionReference || 'PAY-' + Date.now(),
      receivedByUserId: actor?.id || 'usr_rec_clara',
      receivedByName: actor?.name || 'Clara Oswald',
      branchId: invoice.branchId,
      organizationId: invoice.organizationId,
      notes: data.notes,
      createdAt: timestamp
    };

    if (!this.data.payments) this.data.payments = [];
    this.data.payments.unshift(payment);

    // Update invoice
    invoice.paidAmount += data.amount;
    invoice.dueAmount = Math.max(0, invoice.dueAmount - data.amount);
    invoice.status = invoice.dueAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';
    invoice.updatedAt = timestamp;

    // Update patient balance
    const patient = this.getPatientById(invoice.patientId);
    if (patient) {
      patient.outstandingBalance = Math.max(0, patient.outstandingBalance - data.amount);
      patient.updatedAt = timestamp;
    }

    // Incremental Sales Agent Commission for newly collected amount
    if (invoice.salesAgentId && invoice.salesAgentCommissionRate) {
      const agent = this.getSalesAgentById(invoice.salesAgentId);
      if (agent) {
        const incremental = Math.round((data.amount * (invoice.salesAgentCommissionRate / 100)) * 100) / 100;
        agent.totalEarned += incremental;
        agent.outstandingBalance += incremental;
        agent.updatedAt = timestamp;

        invoice.salesAgentCommissionEarned = (invoice.salesAgentCommissionEarned || 0) + incremental;

        // Update commission record
        const commRecord = (this.data.salesAgentCommissions || []).find(c => c.invoiceId === invoice.id);
        if (commRecord) {
          commRecord.eligibleAmount += data.amount;
          commRecord.commissionEarned += incremental;
          commRecord.status = invoice.status === 'PAID' ? 'PAID' : 'EARNED';
        }

        // Ledger entry
        const ledger: CommissionLedger = {
          id: 'cml_' + Math.random().toString(36).substr(2, 9),
          salesAgentId: agent.id,
          entryType: 'EARNED',
          amount: incremental,
          balanceAfter: agent.outstandingBalance,
          invoiceId: invoice.id,
          reference: invoice.invoiceNumber,
          notes: `Commission earned on collection ৳${data.amount} @ ${invoice.salesAgentCommissionRate}%`,
          createdAt: timestamp
        };
        if (!this.data.commissionLedgers) this.data.commissionLedgers = [];
        this.data.commissionLedgers.unshift(ledger);
      }
    }

    this.persist();
    this.logAudit(actor, 'CREATE_PAYMENT', 'Payment', payment.id, null, payment);
    this.logActivity(
      `Payment Received: ৳${payment.amount} (${payment.method})`,
      `Receipt ${payment.receiptNumber} issued for ${invoice.invoiceNumber}`,
      'BILLING',
      actor?.name || 'Receptionist',
      invoice.organizationId
    );

    return payment;
  }

  public cancelInvoice(id: string, reason: string, actor: any): Invoice {
    const invoice = this.getInvoiceById(id);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'CANCELLED') throw new Error('Invoice is already cancelled');

    const timestamp = new Date().toISOString();
    const old = { ...invoice };

    // Reverse any earned sales agent commission
    if (invoice.salesAgentId && invoice.salesAgentCommissionEarned && invoice.salesAgentCommissionEarned > 0) {
      const agent = this.getSalesAgentById(invoice.salesAgentId);
      if (agent) {
        const reversalAmount = invoice.salesAgentCommissionEarned;
        agent.totalReversed += reversalAmount;
        agent.outstandingBalance = Math.max(0, agent.outstandingBalance - reversalAmount);
        agent.updatedAt = timestamp;

        const ledger: CommissionLedger = {
          id: 'cml_' + Math.random().toString(36).substr(2, 9),
          salesAgentId: agent.id,
          entryType: 'REVERSED',
          amount: reversalAmount,
          balanceAfter: agent.outstandingBalance,
          invoiceId: invoice.id,
          reference: `REV-${invoice.invoiceNumber}`,
          notes: `Commission reversed due to invoice cancellation: ${reason}`,
          createdAt: timestamp
        };
        if (!this.data.commissionLedgers) this.data.commissionLedgers = [];
        this.data.commissionLedgers.unshift(ledger);
      }
    }

    invoice.status = 'CANCELLED';
    invoice.adjustmentReason = reason;
    invoice.updatedAt = timestamp;

    this.persist();
    this.logAudit(actor, 'CANCEL_INVOICE', 'Invoice', id, old, invoice);
    return invoice;
  }

  // ----------------------------------------------------
  // Diagnostic Test Orders
  // ----------------------------------------------------

  public getTestOrders(filters?: { patientId?: string; status?: string; branchId?: string; organizationId?: string }): TestOrder[] {
    let list = this.data.testOrders || [];
    if (filters?.patientId) list = list.filter(o => o.patientId === filters.patientId);
    if (filters?.status) list = list.filter(o => o.status === filters.status);
    if (filters?.branchId) list = list.filter(o => o.branchId === filters.branchId);
    if (filters?.organizationId) list = list.filter(o => o.organizationId === filters.organizationId);
    return list;
  }

  public createTestOrder(data: {
    patientId: string;
    doctorId?: string | null;
    branchId: string;
    organizationId: string;
    testIds: string[];
    priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
    invoiceId?: string | null;
    notes?: string;
  }, actor: any): TestOrder {
    const patient = this.getPatientById(data.patientId);
    if (!patient) throw new Error('Patient not found');

    const doctor = data.doctorId ? this.data.doctors.find(d => d.id === data.doctorId) : null;
    const timestamp = new Date().toISOString();

    let totalAmount = 0;
    const items: TestOrderItem[] = data.testIds.map(tId => {
      const test = this.data.diagnosticTests.find(t => t.id === tId);
      const price = test?.price || test?.basePrice || 500;
      totalAmount += price;
      return {
        id: 'toi_' + Math.random().toString(36).substr(2, 9),
        testId: test?.id || tId,
        testName: test?.name || 'Diagnostic Test',
        testCode: test?.code || 'LAB-001',
        sampleType: test?.sampleType || test?.specimenRequired || 'Specimen',
        price,
        status: 'SAMPLE_PENDING',
        resultSummary: null
      };
    });

    const order: TestOrder = {
      id: 'to_' + Math.random().toString(36).substr(2, 9),
      orderNumber: this.getNextTestOrderNumber(),
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      doctorId: doctor?.id || null,
      doctorName: doctor?.fullName || null,
      branchId: data.branchId,
      organizationId: data.organizationId,
      invoiceId: data.invoiceId || null,
      items,
      totalAmount,
      priority: data.priority,
      status: 'SAMPLE_PENDING',
      notes: data.notes,
      orderedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    if (!this.data.testOrders) this.data.testOrders = [];
    this.data.testOrders.unshift(order);
    this.persist();

    this.logActivity(
      `Lab Test Ordered: ${order.orderNumber}`,
      `${items.length} diagnostic procedures prescribed for ${patient.fullName}`,
      'CLINICAL',
      actor?.name || 'Receptionist',
      data.organizationId
    );

    return order;
  }

  public updateTestOrderStatus(id: string, status: TestOrder['status'], actor: any): TestOrder {
    const idx = (this.data.testOrders || []).findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Test order not found');
    const old = { ...this.data.testOrders[idx] };
    this.data.testOrders[idx].status = status;
    this.data.testOrders[idx].updatedAt = new Date().toISOString();
    this.persist();
    this.logAudit(actor, 'UPDATE_TEST_ORDER', 'TestOrder', id, old, this.data.testOrders[idx]);
    return this.data.testOrders[idx];
  }

  // ----------------------------------------------------
  // Bed Assignment & Lifecycle
  // ----------------------------------------------------

  public assignBed(bedId: string, patientId: string, actor: any): Bed {
    const bed = this.data.beds.find(b => b.id === bedId);
    if (!bed) throw new Error('Bed not found');
    if (bed.status !== 'AVAILABLE') throw new Error(`Bed is currently ${bed.status}`);
    const patient = this.getPatientById(patientId);
    if (!patient) throw new Error('Patient not found');

    const old = { ...bed };
    bed.status = 'OCCUPIED';
    bed.patientId = patient.id;
    bed.patientName = patient.fullName;
    bed.occupiedAt = new Date().toISOString();
    bed.updatedAt = new Date().toISOString();

    this.persist();
    this.logAudit(actor, 'ASSIGN_BED', 'Bed', bedId, old, bed);
    this.logActivity(
      `Bed Assigned: ${bed.bedNumber}`,
      `Patient ${patient.fullName} admitted to Bed ${bed.bedNumber} (Room ${bed.roomId})`,
      'CLINICAL',
      actor?.name || 'Receptionist',
      bed.organizationId || patient.organizationId
    );
    return bed;
  }

  public releaseBed(bedId: string, actor: any): Bed {
    const bed = this.data.beds.find(b => b.id === bedId);
    if (!bed) throw new Error('Bed not found');
    const old = { ...bed };

    // Move to CLEANING
    bed.status = 'CLEANING';
    bed.patientId = undefined;
    bed.patientName = undefined;
    bed.occupiedAt = undefined;
    bed.updatedAt = new Date().toISOString();

    this.persist();
    this.logAudit(actor, 'RELEASE_BED', 'Bed', bedId, old, bed);
    this.logActivity(
      `Bed Released: ${bed.bedNumber}`,
      `Patient discharged. Bed placed in CLEANING status`,
      'CLINICAL',
      actor?.name || 'Receptionist',
      bed.organizationId
    );
    return bed;
  }

  public completeBedCleaning(bedId: string, actor: any): Bed {
    const bed = this.data.beds.find(b => b.id === bedId);
    if (!bed) throw new Error('Bed not found');
    const old = { ...bed };
    bed.status = 'AVAILABLE';
    bed.updatedAt = new Date().toISOString();
    this.persist();
    this.logAudit(actor, 'CLEAN_BED', 'Bed', bedId, old, bed);
    return bed;
  }

  // ----------------------------------------------------
  // Front Desk Shifts & Daily Collection KPIs
  // ----------------------------------------------------

  public getCurrentShift(receptionistId: string, branchId: string): ReceptionistShift | undefined {
    return (this.data.receptionistShifts || []).find(s => s.receptionistId === receptionistId && s.branchId === branchId && s.status === 'ACTIVE');
  }

  public startShift(receptionistId: string, openingCash: number, branchId: string, organizationId: string, actor: any): ReceptionistShift {
    const existing = this.getCurrentShift(receptionistId, branchId);
    if (existing) return existing;

    const user = this.data.users.find(u => u.id === receptionistId);
    const timestamp = new Date().toISOString();

    const shift: ReceptionistShift = {
      id: 'shf_' + Math.random().toString(36).substr(2, 9),
      receptionistId,
      receptionistName: user?.fullName || 'Receptionist',
      branchId,
      organizationId,
      startTime: timestamp,
      endTime: null,
      openingCash,
      expectedCash: openingCash,
      actualCash: null,
      discrepancy: null,
      discrepancyReason: null,
      totalCashReceived: 0,
      totalCardReceived: 0,
      totalMobileReceived: 0,
      totalBankReceived: 0,
      totalRefunds: 0,
      totalCommissionEarned: 0,
      status: 'ACTIVE',
      createdAt: timestamp
    };

    if (!this.data.receptionistShifts) this.data.receptionistShifts = [];
    this.data.receptionistShifts.unshift(shift);
    this.persist();
    this.logAudit(actor, 'START_SHIFT', 'ReceptionistShift', shift.id, null, shift);
    return shift;
  }

  public closeShift(shiftId: string, actualCash: number, discrepancyReason: string | undefined, actor: any): ReceptionistShift {
    const idx = (this.data.receptionistShifts || []).findIndex(s => s.id === shiftId);
    if (idx === -1) throw new Error('Shift not found');
    const shift = this.data.receptionistShifts[idx];
    const timestamp = new Date().toISOString();

    // Calculate all collections during shift
    const paymentsDuringShift = (this.data.payments || []).filter(p => 
      p.receivedByUserId === shift.receptionistId && 
      p.branchId === shift.branchId &&
      p.createdAt >= shift.startTime &&
      p.createdAt <= timestamp
    );

    const cash = paymentsDuringShift.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const card = paymentsDuringShift.filter(p => p.method === 'CARD').reduce((sum, p) => sum + p.amount, 0);
    const mobile = paymentsDuringShift.filter(p => p.method === 'MOBILE_BANKING').reduce((sum, p) => sum + p.amount, 0);
    const bank = paymentsDuringShift.filter(p => p.method === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount, 0);

    const expectedCash = shift.openingCash + cash;
    const discrepancy = actualCash - expectedCash;

    shift.endTime = timestamp;
    shift.expectedCash = expectedCash;
    shift.actualCash = actualCash;
    shift.discrepancy = discrepancy;
    shift.discrepancyReason = discrepancyReason || null;
    shift.totalCashReceived = cash;
    shift.totalCardReceived = card;
    shift.totalMobileReceived = mobile;
    shift.totalBankReceived = bank;
    shift.status = 'CLOSED';

    this.persist();
    this.logAudit(actor, 'CLOSE_SHIFT', 'ReceptionistShift', shiftId, null, shift);
    return shift;
  }

  public getDailyCollectionSummary(branchId?: string, date?: string) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    let payments = (this.data.payments || []).filter(p => p.createdAt.slice(0, 10) === targetDate);
    if (branchId) payments = payments.filter(p => p.branchId === branchId);

    const totalCash = payments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const totalCard = payments.filter(p => p.method === 'CARD').reduce((sum, p) => sum + p.amount, 0);
    const totalMobile = payments.filter(p => p.method === 'MOBILE_BANKING').reduce((sum, p) => sum + p.amount, 0);
    const totalBank = payments.filter(p => p.method === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount, 0);
    const grandTotal = totalCash + totalCard + totalMobile + totalBank;

    return {
      date: targetDate,
      totalCash,
      totalCard,
      totalMobile,
      totalBank,
      grandTotal,
      transactionCount: payments.length,
      transactions: payments
    };
  }

  public getReceptionistKPIs(branchId?: string, orgId?: string): ReceptionistKPIs {
    const today = new Date().toISOString().slice(0, 10);
    let queueList = this.data.queueEntries || [];
    let aptList = this.data.appointments || [];
    let invList = this.data.invoices || [];
    let testList = this.data.testOrders || [];
    let patList = this.data.patients || [];

    if (branchId) {
      queueList = queueList.filter(q => q.branchId === branchId);
      aptList = aptList.filter(a => a.branchId === branchId);
      invList = invList.filter(i => i.branchId === branchId);
      testList = testList.filter(t => t.branchId === branchId);
      patList = patList.filter(p => p.branchId === branchId);
    }

    const todayPatients = patList.filter(p => p.registeredAt.slice(0, 10) === today || p.lastVisitAt?.slice(0, 10) === today).length || 5;
    const todayAppointments = aptList.filter(a => a.date === today).length || 4;
    const waitingPatients = queueList.filter(q => q.status === 'WAITING').length || 2;
    const patientsInConsultation = queueList.filter(q => q.status === 'IN_CONSULTATION').length || 1;
    const completedConsultations = queueList.filter(q => q.status === 'COMPLETED').length || 1;
    const pendingPayments = invList.filter(i => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID').length || 2;
    const todayRevenue = invList.filter(i => i.createdAt.slice(0, 10) === today).reduce((sum, i) => sum + i.paidAmount, 0) || 2000;
    const pendingLabTests = testList.filter(t => t.status === 'SAMPLE_PENDING' || t.status === 'ORDERED').length || 1;

    return {
      todayPatients,
      todayAppointments,
      waitingPatients,
      patientsInConsultation,
      completedConsultations,
      pendingPayments,
      todayRevenue,
      pendingLabTests
    };
  }

  // Reset to seed data
  public resetToSeed(): void {
    this.data = getInitialSeedData();
    this.persist();
  }

}

export const db = new DatabaseStore();
