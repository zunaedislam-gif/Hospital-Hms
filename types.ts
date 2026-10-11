/**
 * Pattern HMS - Super Admin & Enterprise Core Types
 */

export type OrganizationType = 'HOSPITAL' | 'DIAGNOSTIC_CENTER' | 'CLINIC' | 'MEDICAL_CENTER';
export type OrganizationStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  logo?: string;
  registrationNumber: string;
  contactNumber: string;
  email: string;
  website: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  timezone: string;
  currency: string;
  taxVatNumber: string;
  emergencyContact: string;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  openingTime: string;
  closingTime: string;
  emergencyStatus: boolean;
  timezone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Department {
  id: string;
  organizationId: string;
  branchId?: string | null;
  name: string;
  code: string;
  description: string;
  headOfDepartment: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface Specialty {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  deletedAt?: string | null;
}

export type RoleCode = 
  | 'SUPER_ADMIN'
  | 'ORGANIZATION_ADMIN'
  | 'RECEPTIONIST'
  | 'DOCTOR'
  | 'PATHOLOGIST'
  | 'LAB_TECHNICIAN'
  | 'ACCOUNTANT'
  | 'HR_MANAGER'
  | 'PHARMACY_STAFF'
  | 'NURSE'
  | 'OTHER_EMPLOYEE';

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
  createdAt: string;
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  name: string;
  description: string;
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'LOCKED';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  employeeId: string;
  roleCode: string;
  organizationId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  designation: string;
  status: UserStatus;
  passwordHash: string;
  lastLogin?: string | null;
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type DoctorStatus = 
  | 'AVAILABLE'
  | 'BUSY'
  | 'ON_BREAK'
  | 'PRAYER_BREAK'
  | 'ON_LEAVE'
  | 'OFF_DUTY'
  | 'EMERGENCY_UNAVAILABLE'
  | 'SUSPENDED';

export interface DoctorSchedule {
  day: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
}

export interface Doctor {
  id: string;
  userId: string;
  fullName: string;
  profilePhoto?: string;
  doctorId: string;
  medicalRegNumber: string;
  specialtyId: string;
  specialtyName?: string;
  qualifications: string;
  experienceYears: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email: string;
  organizationId: string;
  branchId: string;
  departmentId: string;
  consultationFee: number;
  followUpFee: number;
  emergencyFee: number;
  chamberId?: string | null;
  schedule: DoctorSchedule[];
  status: DoctorStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Chamber {
  id: string;
  name: string;
  number: string;
  branchId: string;
  departmentId: string;
  assignedDoctorId?: string | null;
  displayScreenId?: string | null;
  currentQueueToken?: string | null;
  status: 'AVAILABLE' | 'IN_USE' | 'CLOSED' | 'MAINTENANCE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface Pathologist {
  id: string;
  userId: string;
  fullName: string;
  employeeId: string;
  qualification: string;
  registrationNumber: string;
  specialty: string;
  organizationId: string;
  branchId: string;
  laboratoryName: string;
  contactPhone: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface Employee {
  id: string;
  userId: string;
  fullName: string;
  employeeId: string;
  designation: string;
  departmentId: string;
  organizationId: string;
  branchId: string;
  role: string;
  phone: string;
  email: string;
  joiningDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  deletedAt?: string | null;
}

export interface DiagnosticTestCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface DiagnosticTest {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  departmentId: string;
  sampleType: string;
  preparationInstructions: string;
  turnaroundHours: number;
  basePrice: number;
  price?: number;
  specimenRequired?: string;
  discountEligible: boolean;
  taxPercent: number;
  reportType: 'QUANTITATIVE' | 'QUALITATIVE' | 'DESCRIPTIVE' | 'IMAGING';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface TestPrice {
  id: string;
  testId: string;
  organizationId: string;
  branchId?: string | null; // null represents global organization price
  price: number;
  oldPrice?: number | null;
  effectiveFrom: string;
  changedByUserId: string;
  createdAt: string;
}

export interface TestPackage {
  id: string;
  name: string;
  code: string;
  organizationId: string;
  testIds: string[];
  originalPrice: number;
  packagePrice: number;
  discountPercent: number;
  taxPercent: number;
  validityDays: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface HospitalService {
  id: string;
  name: string;
  code: string;
  category: 'CONSULTATION' | 'PROCEDURE' | 'NURSING' | 'BED' | 'AMBULANCE' | 'REGISTRATION' | 'OTHER';
  basePrice: number;
  taxPercent: number;
  organizationId: string;
  branchId?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface QueueConfiguration {
  id: string;
  organizationId: string;
  branchId: string;
  prefix: string;
  startingToken: number;
  dailyReset: boolean;
  numberingFormat: string; // e.g. "{PREFIX}-{NUMBER}"
  maxQueueSize: number;
  priorityPatientSupport: boolean;
  emergencyPatientSupport: boolean;
  displayDurationSeconds: number;
  callingIntervalSeconds: number;
  nextPatientsCount: number;
  queueSound: 'CHIME' | 'BEEP' | 'BELL' | 'NONE';
  voiceAnnouncement: boolean;
  language: 'en' | 'bn' | 'hi';
  displayTheme: 'HEALTHCARE_BLUE' | 'DARK_SLATE' | 'EMERALD_CLEAN' | 'WARM_AMBER';
  autoRefreshIntervalSeconds: number;
  createdAt: string;
}

export interface DisplayScreen {
  id: string;
  name: string;
  displayCode: string;
  displayToken: string;
  organizationId: string;
  branchId: string;
  waitingRoomName: string;
  assignedChamberIds: string[];
  assignedDoctorIds: string[];
  screenType: 'DOCTOR_QUEUE' | 'GENERAL_WAITING' | 'LABORATORY' | 'EMERGENCY';
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  language: string;
  theme: string;
  status: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  lastPingAt: string;
  createdAt: string;
  deletedAt?: string | null;
}

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'CLEANING' | 'OUT_OF_SERVICE';

export interface BedType {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  floor: string;
  branchId: string;
  departmentId: string;
  totalCapacity: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface Room {
  id: string;
  wardId: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
  createdAt: string;
  deletedAt?: string | null;
}

export interface Bed {
  id: string;
  bedNumber: string;
  code?: string;
  roomId: string;
  wardId: string;
  bedTypeId: string;
  branchId: string;
  organizationId?: string;
  pricePerDay: number;
  status: BedStatus;
  currentPatientMaskedId?: string | null;
  patientId?: string | null;
  patientName?: string | null;
  occupiedAt?: string | null;
  updatedAt?: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface BillingConfiguration {
  id: string;
  organizationId: string;
  branchId?: string | null;
  invoicePrefix: string;
  invoiceNumberFormat: string; // e.g. "{PREFIX}-{YEAR}-{SEQ}"
  invoiceStartingNumber: number;
  defaultDueDays: number;
  invoiceFooter: string;
  receiptFormat: 'STANDARD_A4' | 'POS_RECEIPT_80MM' | 'COMPACT_A5';
  refundPolicy: string;
  cancellationPolicy: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: 'CASH' | 'CARD' | 'MOBILE_BANKING' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER';
  description: string;
  organizationId?: string | null;
  branchId?: string | null;
  isEnabled: boolean;
  surchargePercent: number;
  createdAt: string;
}

export interface TaxRate {
  id: string;
  name: string;
  ratePercent: number;
  taxType: 'VAT' | 'SALES_TAX' | 'EXEMPTION' | 'SURCHARGE';
  organizationId?: string | null;
  branchId?: string | null;
  effectiveFrom: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  code: string;
  description: string;
  isSystem: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  category: 'AUTH' | 'ORGANIZATION' | 'CLINICAL' | 'BILLING' | 'SYSTEM' | 'SECURITY';
  organizationId?: string | null;
  actorName: string;
  timestamp: string;
}

export interface NotificationTemplate {
  id: string;
  code: string;
  name: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject: string;
  bodyTemplate: string;
  isEnabled: boolean;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';
  description: string;
  scope: 'GLOBAL' | 'ORGANIZATION' | 'SECURITY';
  updatedAt: string;
  updatedBy: string;
}

export interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  ipAddress: string;
  userAgent: string;
  deviceType: string;
  lastActive: string;
  createdAt: string;
}

export interface DashboardKPIs {
  organizations: {
    totalHospitals: number;
    totalDiagnosticCenters: number;
    activeOrganizations: number;
    inactiveOrganizations: number;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    doctors: number;
    receptionists: number;
    pathologists: number;
    laboratoryStaff: number;
    administrators: number;
  };
  patients: {
    totalPatients: number;
    todayRegistered: number;
    todayAppointments: number;
    todayCompletedAppointments: number;
  };
  diagnostics: {
    totalTests: number;
    activeTests: number;
    testsPerformedToday: number;
    pendingLaboratoryTests: number;
  };
  financial: {
    todayRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    outstandingInvoices: number;
    paidInvoices: number;
    unpaidInvoices: number;
  };
  infrastructure: {
    occupiedBeds: number;
    availableBeds: number;
    maintenanceBeds: number;
    totalBeds: number;
  };
}

// ----------------------------------------------------
// Receptionist Panel Domain Models
// ----------------------------------------------------

export interface Patient {
  id: string;
  patientId: string; // e.g. PAT-2026-000001
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  age: number;
  phone: string;
  email: string;
  nidNumber?: string;
  address: string;
  city?: string;
  emergencyContact?: string;
  bloodGroup: string;
  maritalStatus?: string;
  occupation?: string;
  medicalHistory?: any;
  organizationId: string;
  branchId: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalVisits?: number;
  outstandingBalance?: number;
  lastVisitAt?: string | null;
  registeredByUserId?: string;
  registeredAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Appointment {
  id: string;
  appointmentNumber: string; // e.g. APT-2026-000001
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  departmentId?: string;
  departmentName?: string;
  branchId: string;
  organizationId: string;
  chamberName: string;
  chamberNumber: string;
  date: string;
  timeSlot: string;
  type: 'REGULAR' | 'FOLLOW_UP' | 'EMERGENCY' | 'WALK_IN' | 'CONSULTATION' | 'REPORT_CHECK';
  consultationFee?: number;
  fee?: number;
  notes: string;
  status: 'BOOKED' | 'CONFIRMED' | 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'SCHEDULED' | 'IN_PROGRESS';
  checkedInAt?: string | null;
  queueToken?: string | null;
  createdByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export type QueuePriority = 'NORMAL' | 'PRIORITY' | 'EMERGENCY' | 'APPOINTMENT' | 'FOLLOW_UP' | 'URGENT' | 'VIP';
export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' | 'NO_SHOW' | 'PAUSED';

export interface QueueEntry {
  id: string;
  tokenNumber: string; // e.g. A-101
  sequenceNumber: number;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  chamberId: string;
  chamberNumber: string;
  branchId: string;
  organizationId: string;
  priority: QueuePriority;
  status: QueueStatus;
  visitType: 'WALK_IN' | 'APPOINTMENT' | 'FOLLOW_UP';
  calledCount: number;
  lastCalledAt?: string | null;
  completedAt?: string | null;
  appointmentId?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesAgent {
  id: string;
  agentId: string; // e.g. SA-001
  fullName: string;
  phone: string;
  email: string;
  nidNumber?: string;
  address: string;
  organizationId: string;
  branchId: string;
  commissionPercentage: number; // e.g. 45
  status: 'ACTIVE' | 'INACTIVE';
  totalEarned: number;
  totalPaid: number;
  totalReversed: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesAgentCommission {
  id: string;
  salesAgentId: string;
  salesAgentName: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  branchId: string;
  organizationId: string;
  grossAmount: number;
  discountAmount: number;
  eligibleAmount: number; // Actual collected post-discount basis
  commissionRateSnapshot: number; // Snapshot of rate when invoice was finalized (e.g. 45%)
  commissionEarned: number; // exact rounded monetary value
  commissionPaid: number;
  status: 'PENDING' | 'EARNED' | 'PAID' | 'PARTIALLY_PAID' | 'REVERSED' | 'ADJUSTED';
  createdAt: string;
}

export interface CommissionLedger {
  id: string;
  salesAgentId: string;
  entryType: 'EARNED' | 'PAID' | 'REVERSED' | 'ADJUSTMENT';
  amount: number;
  balanceAfter: number;
  invoiceId?: string | null;
  reference: string;
  notes: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  itemType: 'CONSULTATION' | 'DIAGNOSTIC_TEST' | 'PACKAGE' | 'BED' | 'SERVICE';
  itemId: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  subtotal: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-000001
  patientId: string;
  patientName: string;
  patientPhone: string;
  organizationId: string;
  branchId: string;
  receptionistId: string;
  receptionistName: string;
  salesAgentId?: string | null;
  salesAgentName?: string | null;
  salesAgentCommissionRate?: number | null; // Historical Snapshot
  salesAgentCommissionEarned?: number | null;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  netPayable: number;
  paidAmount: number;
  dueAmount: number;
  status: 'DRAFT' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED' | 'ADJUSTED';
  adjustmentReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  receiptNumber: string; // e.g. REC-2026-000001
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'MOBILE_BANKING' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER';
  transactionReference: string;
  receivedByUserId: string;
  receivedByName: string;
  branchId: string;
  organizationId: string;
  notes?: string;
  createdAt: string;
}

export interface TestOrderItem {
  id: string;
  testId: string;
  testName: string;
  testCode: string;
  sampleType: string;
  price: number;
  status: 'SAMPLE_PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'VERIFIED';
  resultSummary?: string | null;
  parameters?: LabParameterResult[];
  sampleIdentifier?: string;
  sampleCollectedAt?: string;
  sampleCollectedBy?: string;
  processingStartedAt?: string;
  assignedTechnician?: string;
  instrumentUsed?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  criticalResultAcknowledged?: boolean;
  criticalAlertNotes?: string;
  amendments?: LabAmendment[];
}

export interface TestOrder {
  id: string;
  orderNumber: string; // e.g. TO-2026-000001
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId?: string | null;
  doctorName?: string | null;
  branchId: string;
  organizationId: string;
  invoiceId?: string | null;
  items: TestOrderItem[];
  totalAmount: number;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: 'ORDERED' | 'SAMPLE_PENDING' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'VERIFICATION_PENDING' | 'VERIFIED' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  clinicalIndication?: string;
  orderedAt: string;
  sampleCollectedAt?: string;
  sampleCollectedBy?: string;
  processingStartedAt?: string;
  assignedTechnician?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceptionistShift {
  id: string;
  receptionistId: string;
  receptionistName: string;
  branchId: string;
  organizationId: string;
  startTime: string;
  endTime?: string | null;
  openingCash: number;
  expectedCash: number;
  actualCash?: number | null;
  discrepancy?: number | null;
  discrepancyReason?: string | null;
  totalCashReceived: number;
  totalCardReceived: number;
  totalMobileReceived: number;
  totalBankReceived: number;
  totalRefunds: number;
  totalCommissionEarned: number;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
}

export interface ReceptionistKPIs {
  todayPatients: number;
  todayAppointments: number;
  waitingPatients: number;
  patientsInConsultation: number;
  completedConsultations: number;
  pendingPayments: number;
  todayRevenue: number;
  pendingLabTests: number;
}

export interface ConsultationVitals {
  bpSystolic?: number;
  bpDiastolic?: number;
  pulse?: number;
  temperature?: number;
  respiratoryRate?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface ConsultationDiagnosis {
  primary: string;
  secondary?: string[];
  notes?: string;
}

export interface Consultation {
  id: string;
  consultationNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  chamberNumber?: string;
  queueEntryId?: string;
  appointmentId?: string;
  branchId: string;
  organizationId: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  chiefComplaint: string;
  historyOfPresentIllness: string;
  examination: string;
  vitals: ConsultationVitals;
  assessment: string;
  diagnosis: ConsultationDiagnosis;
  treatmentPlan: string;
  followUpRequired: boolean;
  followUpDate?: string;
  followUpNotes?: string;
  prescriptionId?: string;
  testOrderIds: string[];
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionMedicine {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
  quantity: string;
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  doctorQualifications: string;
  doctorRegNumber: string;
  branchId: string;
  organizationId: string;
  date: string;
  medicines: PrescriptionMedicine[];
  clinicalNotes: string;
  advice: string;
  followUpDate?: string;
  createdAt: string;
}

export interface DoctorAvailabilityState {
  doctorId: string;
  doctorName?: string;
  chamberNumber?: string;
  status: 'AVAILABLE' | 'BUSY' | 'ON_BREAK' | 'ON_PRAYER_BREAK' | 'ON_LEAVE' | 'EMERGENCY' | 'OFFLINE';
  breakType?: 'REGULAR_BREAK' | 'PRAYER_BREAK' | 'EMERGENCY';
  breakStartedAt?: string;
  expectedReturnTime?: string;
  breakNotes?: string;
  lastUpdatedAt: string;
}

export interface LabParameterResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
  comments?: string;
}

export interface LabAmendment {
  amendedAt: string;
  amendedBy: string;
  reason: string;
  previousResults: LabParameterResult[];
}

export interface Refund {
  id: string;
  refundNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  paymentId?: string;
  patientId: string;
  patientName: string;
  amount: number;
  reason: string;
  method: 'CASH' | 'CARD' | 'BANK' | 'MOBILE';
  status: 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';
  requestedBy: string;
  approvedBy?: string;
  processedBy?: string;
  branchId: string;
  organizationId: string;
  createdAt: string;
  processedAt?: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  category: 'RENT' | 'UTILITIES' | 'SALARY' | 'MAINTENANCE' | 'SUPPLIES' | 'LABORATORY' | 'PHARMACY' | 'TRANSPORT' | 'MARKETING' | 'OTHER';
  amount: number;
  date: string;
  vendorPayee: string;
  paymentMethod: 'CASH' | 'CARD' | 'BANK' | 'MOBILE';
  reference: string;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  createdBy: string;
  approvedBy?: string;
  branchId: string;
  organizationId: string;
  createdAt: string;
}

export interface CashClosing {
  id: string;
  closingNumber: string;
  closingDate: string;
  branchId: string;
  organizationId: string;
  closedBy: string;
  closedByName: string;
  openingCash: number;
  cashCollection: number;
  cashExpenses: number;
  cashRefunds: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  varianceExplanation?: string;
  status: 'BALANCED' | 'DISCREPANCY';
  notes?: string;
  createdAt: string;
}

