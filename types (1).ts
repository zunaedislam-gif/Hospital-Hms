/**
 * Pattern HMS - Frontend Shared Types
 */

export type NavigationTab = 
  | 'dashboard'
  | 'reception'
  | 'doctor'
  | 'laboratory'
  | 'waitingDisplay'
  | 'finance'
  | 'organizations'
  | 'users'
  | 'clinical'
  | 'diagnostics'
  | 'queue'
  | 'beds'
  | 'billing'
  | 'reports'
  | 'audit'
  | 'settings';

export interface UserSession {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  employeeId: string;
  roleCode: string;
  organizationId?: string | null;
  branchId?: string | null;
  designation: string;
  status: string;
  lastLogin?: string | null;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  name: string;
  description: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'HOSPITAL' | 'DIAGNOSTIC_CENTER' | 'CLINIC' | 'MEDICAL_CENTER';
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
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  createdAt: string;
  branchCount?: number;
  userCount?: number;
  doctorCount?: number;
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
}

export interface Specialty {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Doctor {
  id: string;
  userId: string;
  fullName: string;
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
  organizationName?: string;
  branchId: string;
  branchName?: string;
  departmentId: string;
  consultationFee: number;
  followUpFee: number;
  emergencyFee: number;
  chamberId?: string | null;
  chamberName?: string;
  schedule: { day: string; startTime: string; endTime: string; maxPatients: number }[];
  status: 'AVAILABLE' | 'BUSY' | 'ON_BREAK' | 'PRAYER_BREAK' | 'ON_LEAVE' | 'OFF_DUTY' | 'EMERGENCY_UNAVAILABLE' | 'SUSPENDED';
}

export interface DiagnosticTest {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  categoryName?: string;
  departmentId: string;
  sampleType: string;
  preparationInstructions: string;
  turnaroundHours: number;
  basePrice: number;
  discountEligible: boolean;
  taxPercent: number;
  reportType: 'QUANTITATIVE' | 'QUALITATIVE' | 'DESCRIPTIVE' | 'IMAGING';
  status: 'ACTIVE' | 'INACTIVE';
  branchPriceCount?: number;
}

export interface TestPrice {
  id: string;
  testId: string;
  testName?: string;
  testCode?: string;
  organizationId: string;
  branchId?: string | null;
  branchName?: string;
  price: number;
  oldPrice?: number | null;
  effectiveFrom: string;
  changedByUserId: string;
}

export interface TestPackage {
  id: string;
  name: string;
  code: string;
  organizationId: string;
  testIds: string[];
  tests?: DiagnosticTest[];
  originalPrice: number;
  packagePrice: number;
  discountPercent: number;
  taxPercent: number;
  validityDays: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface HospitalService {
  id: string;
  name: string;
  code: string;
  category: 'CONSULTATION' | 'PROCEDURE' | 'NURSING' | 'BED' | 'AMBULANCE' | 'REGISTRATION' | 'OTHER';
  basePrice: number;
  taxPercent: number;
  organizationId: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface QueueConfiguration {
  id: string;
  organizationId: string;
  branchId: string;
  prefix: string;
  startingToken: number;
  dailyReset: boolean;
  numberingFormat: string;
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
}

export interface DisplayScreen {
  id: string;
  name: string;
  displayCode: string;
  displayToken: string;
  organizationId: string;
  organizationName?: string;
  branchId: string;
  branchName?: string;
  waitingRoomName: string;
  assignedChamberIds: string[];
  chambers?: { id: string; name: string; number: string }[];
  screenType: 'DOCTOR_QUEUE' | 'GENERAL_WAITING' | 'LABORATORY' | 'EMERGENCY';
  orientation: 'LANDSCAPE' | 'PORTRAIT';
  language: string;
  theme: string;
  status: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  lastPingAt: string;
}

export interface Bed {
  id: string;
  bedNumber: string;
  roomId: string;
  roomNumber?: string;
  wardId: string;
  wardName?: string;
  bedTypeId: string;
  bedTypeName?: string;
  branchId: string;
  pricePerDay: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE' | 'CLEANING' | 'OUT_OF_SERVICE';
  currentPatientMaskedId?: string | null;
}

export interface Ward {
  id: string;
  name: string;
  code: string;
  floor: string;
  branchId: string;
  departmentId: string;
  totalCapacity: number;
  totalBeds?: number;
  occupiedBeds?: number;
  availableBeds?: number;
  occupancyRate?: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  isEnabled: boolean;
  surchargePercent: number;
}

export interface TaxRate {
  id: string;
  name: string;
  ratePercent: number;
  taxType: string;
  effectiveFrom: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface FinancialCategory {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  code: string;
  description: string;
  isSystem: boolean;
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

export interface Room {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  capacity: number;
  wardId: string;
  wardName?: string;
  branchId: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface InvoiceSetting {
  id: string;
  organizationId: string;
  invoicePrefix: string;
  invoiceNumberPadding: number;
  nextInvoiceNumber: number;
  defaultPaymentDueDays: number;
  termsAndConditions: string;
  footerNote: string;
  enableTaxCalculation: boolean;
  showTaxBreakdownOnReceipt: boolean;
}

export interface QueueItem {
  id: string;
  tokenNumber: string;
  sequenceNumber?: number;
  patientName: string;
  patientId?: string;
  patientPhone?: string;
  doctorName: string;
  departmentName?: string;
  chamberName: string;
  chamberNumber?: string;
  status: 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'SKIPPED';
  timeWaitingMinutes?: number;
  estimatedWaitMinutes?: number;
  isEmergency?: boolean;
  branchId?: string;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QueueSoundSetting {
  id: string;
  soundAlert?: 'CHIME' | 'BEEP' | 'BELL' | 'NONE';
  volume?: number;
  voiceGender?: 'FEMALE' | 'MALE';
  repeatCount?: number;
  announcementPreamble?: string;
  enableVoiceAnnouncement?: boolean;
  chimeTone?: 'AIRPORT_CHIME' | 'HOSPITAL_BELL' | 'MELODIC_TRIAD' | 'SUBTLE_BEEP';
  voiceLanguage?: string;
  volumePercent?: number;
  repeatTimes?: number;
  announcementFormat?: string;
}

export interface QueueRule {
  id: string;
  maxPatientsPerDoctor?: number;
  emergencyBypassEnabled?: boolean;
  autoMarkNoShowMinutes?: number;
  allowSelfCheckIn?: boolean;
  anonymizePatientNameOnDisplay?: 'INITIALS_ONLY' | 'FULL_NAME' | 'TOKEN_ONLY';
  estimatedMinutesPerPatient?: number;
  maxAutoRecalls?: number;
  priorityQueueForEmergency?: boolean;
  enableSmsTokenNotification?: boolean;
}

export interface SystemSetting {
  id: string;
  softwareName: string;
  companyName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  timezone: string;
  sessionTimeoutMinutes: number;
  maintenanceMode: boolean;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: 'SMS' | 'EMAIL' | 'PUSH';
  triggerEvent: string;
  bodyTemplate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SystemHealth {
  databaseStatus: string;
  uptime: string;
  apiLatencyMs: number;
  memoryUsageMB: number;
  storageUsageMB: number;
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
// Receptionist & Front-Desk Domain Models
// ----------------------------------------------------

export type QueuePriority = 'NORMAL' | 'URGENT' | 'EMERGENCY' | 'VIP' | 'APPOINTMENT';
export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'PAUSED' | 'CANCELLED';

export interface Patient {
  id: string;
  patientId: string;
  fullName: string;
  phone: string;
  email?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob?: string;
  age: number;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  medicalHistory?: {
    allergies?: string[];
    chronicDiseases?: string[];
    previousSurgeries?: string[];
    currentMedications?: string[];
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  totalVisits: number;
  outstandingBalance: number;
  lastVisitAt?: string;
  organizationId: string;
  branchId: string;
  registeredByUserId: string;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  chamberName: string;
  chamberNumber: string;
  branchId: string;
  organizationId: string;
  date: string;
  timeSlot: string;
  type: 'CONSULTATION' | 'FOLLOW_UP' | 'REPORT_CHECK' | 'EMERGENCY';
  status: 'SCHEDULED' | 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  fee: number;
  notes?: string;
  queueToken?: string;
  checkedInAt?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QueueEntry {
  id: string;
  tokenNumber: string;
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
  lastCalledAt?: string;
  completedAt?: string;
  appointmentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesAgent {
  id: string;
  agentId: string;
  fullName: string;
  phone: string;
  email?: string;
  nidNumber?: string;
  address?: string;
  commissionPercentage: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  organizationId: string;
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
  salesAgentCode?: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  branchId: string;
  organizationId: string;
  grossAmount: number;
  discountAmount?: number;
  eligibleAmount?: number;
  commissionRateSnapshot?: number;
  commissionRate?: number;
  commissionEarned?: number;
  commissionAmount?: number;
  commissionPaid?: number;
  status: 'PENDING' | 'EARNED' | 'PAID' | 'PARTIALLY_PAID' | 'REVERSED';
  paidAt?: string;
  updatedAt?: string;
  createdAt: string;
}

export interface CommissionLedger {
  id: string;
  salesAgentId: string;
  entryType: 'EARNED' | 'PAID' | 'REVERSED' | 'ADJUSTMENT';
  amount: number;
  balanceAfter: number;
  invoiceId?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  serviceType: 'CONSULTATION' | 'DIAGNOSTIC_TEST' | 'BED_CHARGE' | 'MEDICINE' | 'NURSING' | 'PROCEDURE';
  itemId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  subtotal: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  organizationId: string;
  branchId: string;
  receptionistId: string;
  receptionistName: string;
  salesAgentId?: string | null;
  salesAgentName?: string | null;
  salesAgentCommissionRate?: number | null;
  salesAgentCommissionEarned?: number | null;
  items: InvoiceItem[];
  subtotal: number;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  netPayable: number;
  totalAmount?: number;
  paidAmount: number;
  dueAmount: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  adjustmentReason?: string;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  paymentNumber?: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'MOBILE_BANKING' | 'BANK_TRANSFER' | 'MOBILE' | 'BANK' | 'ONLINE' | 'OTHER';
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
  status: 'SAMPLE_PENDING' | 'COLLECTED' | 'PROCESSING' | 'COMPLETED';
  resultSummary?: string | null;
  criticalAlertNotes?: string | null;
  parameters?: LabParameterResult[];
}

export interface TestOrder {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  doctorId?: string | null;
  doctorName?: string | null;
  branchId: string;
  organizationId: string;
  invoiceId?: string | null;
  items: TestOrderItem[];
  totalAmount: number;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: 'SAMPLE_PENDING' | 'SAMPLE_COLLECTED' | 'COLLECTED' | 'PROCESSING' | 'RESULT_READY' | 'IN_LAB' | 'VERIFIED' | 'DELIVERED';
  barcode?: string;
  sampleType?: string;
  instrumentUsed?: string;
  resultSummary?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  amendments?: LabAmendment[];
  notes?: string;
  orderedAt: string;
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
  id?: string;
  name?: string;
  parameterName?: string;
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

