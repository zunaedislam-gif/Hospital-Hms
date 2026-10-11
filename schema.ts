/**
 * Pattern HMS - Default Roles, System Permissions & Schema Constants
 */
import { Permission, Role } from '../types.js';

export const SYSTEM_PERMISSIONS: Permission[] = [
  // Organization & Branches
  { id: 'p_org_manage', code: 'organization.manage', module: 'Organization', name: 'Manage Organizations', description: 'Create, edit, suspend, and configure organizations' },
  { id: 'p_org_view', code: 'organization.view', module: 'Organization', name: 'View Organizations', description: 'View organization details and statistics' },
  { id: 'p_branch_manage', code: 'branch.manage', module: 'Branch', name: 'Manage Branches', description: 'Create, update, and manage hospital branches' },
  { id: 'p_dept_manage', code: 'department.manage', module: 'Clinical', name: 'Manage Departments', description: 'Configure clinical and administrative departments' },
  { id: 'p_spec_manage', code: 'specialty.manage', module: 'Clinical', name: 'Manage Specialties', description: 'Configure medical specialties and designations' },

  // Users & Access
  { id: 'p_user_create', code: 'user.create', module: 'Users', name: 'Create Users', description: 'Create new staff, doctors, and admin accounts' },
  { id: 'p_user_edit', code: 'user.edit', module: 'Users', name: 'Edit Users', description: 'Edit user profile, designations, and assignments' },
  { id: 'p_user_suspend', code: 'user.suspend', module: 'Users', name: 'Suspend/Lock Users', description: 'Suspend, lock, or reset user access credentials' },
  { id: 'p_user_view', code: 'user.view', module: 'Users', name: 'View Users', description: 'View staff directories and security status' },
  { id: 'p_role_manage', code: 'role.manage', module: 'Users', name: 'Manage Roles & Permissions', description: 'Create and assign custom roles and permissions' },

  // Doctors & Clinical
  { id: 'p_doctor_view', code: 'doctor.view', module: 'Clinical', name: 'View Doctors', description: 'View doctor directory and schedules' },
  { id: 'p_doctor_create', code: 'doctor.create', module: 'Clinical', name: 'Create Doctor', description: 'Register new doctor profiles and medical credentials' },
  { id: 'p_doctor_edit', code: 'doctor.edit', module: 'Clinical', name: 'Edit Doctor', description: 'Update doctor fees, schedules, and chamber assignments' },
  { id: 'p_pathologist_manage', code: 'pathologist.manage', module: 'Clinical', name: 'Manage Pathologists', description: 'Register and assign laboratory pathologists' },

  // Patients
  { id: 'p_patient_view', code: 'patient.view', module: 'Patients', name: 'View Patients', description: 'Access patient records and history' },
  { id: 'p_patient_create', code: 'patient.create', module: 'Patients', name: 'Create Patients', description: 'Register new outpatient and inpatient clients' },
  { id: 'p_patient_edit', code: 'patient.edit', module: 'Patients', name: 'Edit Patients', description: 'Update patient demographics and emergency contacts' },
  { id: 'p_patient_search', code: 'patient.search', module: 'Patients', name: 'Search Patients', description: 'Global quick search by phone, ID, or name' },
  { id: 'p_patient_delete', code: 'patient.delete', module: 'Patients', name: 'Delete Patients', description: 'Soft-delete or archive patient files' },

  // Appointments
  { id: 'p_appointment_view', code: 'appointment.view', module: 'Appointments', name: 'View Appointments', description: 'View booked and today appointment schedules' },
  { id: 'p_appointment_create', code: 'appointment.create', module: 'Appointments', name: 'Create Appointments', description: 'Book doctor visits and outpatient consultation slots' },
  { id: 'p_appointment_edit', code: 'appointment.edit', module: 'Appointments', name: 'Edit Appointments', description: 'Reschedule or edit appointment details' },
  { id: 'p_appointment_cancel', code: 'appointment.cancel', module: 'Appointments', name: 'Cancel Appointments', description: 'Cancel bookings and update attendance status' },
  { id: 'p_appointment_checkin', code: 'appointment.checkin', module: 'Appointments', name: 'Check-in Appointment', description: 'Check-in arriving patient and generate queue token' },

  // Diagnostic Tests & Packages
  { id: 'p_test_view', code: 'test.view', module: 'Diagnostics', name: 'View Diagnostic Tests', description: 'Browse test catalog and prices' },
  { id: 'p_test_create', code: 'test.create', module: 'Diagnostics', name: 'Create Tests', description: 'Add new diagnostic tests, codes, and turnaround times' },
  { id: 'p_test_edit', code: 'test.edit', module: 'Diagnostics', name: 'Edit Tests', description: 'Update test parameters, specimen instructions, and categories' },
  { id: 'p_test_order', code: 'test.order', module: 'Diagnostics', name: 'Order Diagnostic Tests', description: 'Create lab test orders for outpatients' },
  { id: 'p_price_manage', code: 'price.manage', module: 'Diagnostics', name: 'Manage Test Pricing', description: 'Set global and branch-specific diagnostic prices' },
  { id: 'p_service_manage', code: 'service.manage', module: 'Billing', name: 'Manage Services', description: 'Manage clinical procedures, consultations, and bed charges' },

  // Queue & Display
  { id: 'p_queue_view', code: 'queue.view', module: 'Queue', name: 'View Queue', description: 'Monitor live patient queue and token progress' },
  { id: 'p_queue_create', code: 'queue.create', module: 'Queue', name: 'Generate Tokens', description: 'Issue tokens and sequence numbers for walk-in patients' },
  { id: 'p_queue_manage', code: 'queue.manage', module: 'Queue', name: 'Manage Queue Config', description: 'Configure token numbering, voice announcements, and sounds' },
  { id: 'p_queue_call', code: 'queue.call', module: 'Queue', name: 'Call Patient Token', description: 'Advance, call and recall tokens to chambers' },
  { id: 'p_queue_skip', code: 'queue.skip', module: 'Queue', name: 'Skip/Hold Queue Token', description: 'Skip or pause no-show tokens in line' },
  { id: 'p_queue_pause', code: 'queue.pause', module: 'Queue', name: 'Pause/Resume Queue', description: 'Temporarily pause token calling during breaks' },
  { id: 'p_display_view', code: 'display.view', module: 'Display', name: 'View Display Screens', description: 'View waiting-room screen statuses and previews' },
  { id: 'p_display_manage', code: 'display.manage', module: 'Display', name: 'Manage Display Screens', description: 'Register and link displays to doctor chambers' },

  // Beds & Wards
  { id: 'p_bed_view', code: 'bed.view', module: 'Beds', name: 'View Beds & Wards', description: 'Check bed occupancy, available units, and cleaning status' },
  { id: 'p_bed_assign', code: 'bed.assign', module: 'Beds', name: 'Assign Beds', description: 'Admit and assign patients to available hospital beds' },
  { id: 'p_bed_manage', code: 'bed.manage', module: 'Beds', name: 'Manage Beds & Wards', description: 'Configure wards, rooms, bed types, and daily rates' },

  // Billing & Financials
  { id: 'p_invoice_view', code: 'invoice.view', module: 'Billing', name: 'View Invoices', description: 'View billing records, vouchers, and statements' },
  { id: 'p_invoice_create', code: 'invoice.create', module: 'Billing', name: 'Create Invoices', description: 'Generate invoices for consultations and diagnostics' },
  { id: 'p_invoice_edit', code: 'invoice.edit', module: 'Billing', name: 'Edit Invoices', description: 'Apply permitted adjustments and discounts' },
  { id: 'p_invoice_print', code: 'invoice.print', module: 'Billing', name: 'Print Invoices & Receipts', description: 'Print thermal slips, receipts, and patient tokens' },
  { id: 'p_payment_create', code: 'payment.create', module: 'Billing', name: 'Collect Payments', description: 'Receive cash, card, and mobile banking payments' },
  { id: 'p_payment_view', code: 'payment.view', module: 'Billing', name: 'View Payments', description: 'View transaction logs and payment receipts' },
  { id: 'p_discount_apply', code: 'discount.apply', module: 'Billing', name: 'Apply Discounts', description: 'Apply configured percentages or fixed discounts' },
  { id: 'p_discount_approve', code: 'discount.approve', module: 'Billing', name: 'Approve High Discounts', description: 'Authorize manager-level discounts' },
  { id: 'p_invoice_delete', code: 'invoice.delete', module: 'Billing', name: 'Cancel/Delete Invoices', description: 'Void or cancel unpaid invoices' },
  { id: 'p_invoice_refund', code: 'invoice.refund', module: 'Billing', name: 'Refund Invoices', description: 'Authorize client refunds with audit traceability' },
  { id: 'p_billing_config', code: 'billing.config', module: 'Billing', name: 'Configure Billing & Tax', description: 'Configure invoice formats, payment channels, and VAT' },

  // Sales Agents & Commission
  { id: 'p_sales_agent_view', code: 'sales_agent.view', module: 'Sales Agents', name: 'View Sales Agents', description: 'View sales agent profiles and commission rates' },
  { id: 'p_sales_agent_assign', code: 'sales_agent.assign', module: 'Sales Agents', name: 'Assign Sales Agent', description: 'Link referral sales agents to patient billing invoices' },
  { id: 'p_sales_agent_manage', code: 'sales_agent.manage', module: 'Sales Agents', name: 'Manage Sales Agents', description: 'Create and configure sales agents and commission percentages' },

  // Shift & Cash Closing
  { id: 'p_shift_manage', code: 'shift.manage', module: 'Front Desk', name: 'Manage Shifts & Cash', description: 'Start shift, record cash handover, and view daily collection' },

  // Reports & Audits
  { id: 'p_report_view', code: 'report.view', module: 'Reports', name: 'View Reports', description: 'View executive revenue, patient flow, and bed analytics' },
  { id: 'p_report_export', code: 'report.export', module: 'Reports', name: 'Export Reports', description: 'Download CSV and PDF reports with compliance logs' },
  { id: 'p_audit_view', code: 'audit.view', module: 'Audit', name: 'View Audit Logs', description: 'Access immutable security, change, and activity logs' },
  { id: 'p_settings_manage', code: 'settings.manage', module: 'System', name: 'Manage System Settings', description: 'Control global localization, security policies, and templates' }
];

const ALL_PERMISSION_CODES = SYSTEM_PERMISSIONS.map(p => p.code);

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'role_super_admin',
    code: 'SUPER_ADMIN',
    name: 'Super Administrator',
    description: 'Platform owner with unrestricted access across all organizations and system configurations',
    isSystemRole: true,
    permissions: ALL_PERMISSION_CODES,
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_org_admin',
    code: 'ORGANIZATION_ADMIN',
    name: 'Hospital / Center Administrator',
    description: 'Executive administrator of an assigned hospital or diagnostic center and its branches',
    isSystemRole: true,
    permissions: ALL_PERMISSION_CODES.filter(p => !['settings.manage', 'organization.manage'].includes(p)),
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_doctor',
    code: 'DOCTOR',
    name: 'Medical Doctor / Specialist',
    description: 'Consultant attending patients, writing prescriptions, and calling chamber tokens',
    isSystemRole: true,
    permissions: ['doctor.view', 'patient.view', 'patient.create', 'patient.edit', 'queue.view', 'queue.call', 'queue.pause', 'display.view', 'test.view', 'report.view'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_pathologist',
    code: 'PATHOLOGIST',
    name: 'Pathologist / Lab Director',
    description: 'Specialist reviewing lab specimens, entering diagnostics findings, and certifying reports',
    isSystemRole: true,
    permissions: ['test.view', 'test.create', 'test.edit', 'patient.view', 'report.view'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_lab_technician',
    code: 'LAB_TECHNICIAN',
    name: 'Laboratory Technician',
    description: 'Staff operating lab machinery, processing test orders, and entering raw results',
    isSystemRole: true,
    permissions: ['test.view', 'patient.view', 'queue.view'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_receptionist',
    code: 'RECEPTIONIST',
    name: 'Front-Desk Receptionist',
    description: 'Patient admissions, appointment scheduling, token generation, diagnostic ordering, billing, and fee collection',
    isSystemRole: true,
    permissions: [
      'patient.view', 'patient.create', 'patient.edit', 'patient.search',
      'appointment.view', 'appointment.create', 'appointment.edit', 'appointment.cancel', 'appointment.checkin',
      'queue.view', 'queue.create', 'queue.manage', 'queue.call', 'queue.skip', 'queue.pause',
      'display.view', 'display.manage',
      'invoice.view', 'invoice.create', 'invoice.edit', 'invoice.print',
      'payment.create', 'payment.view',
      'discount.apply', 'discount.approve',
      'test.view', 'test.order',
      'service.view',
      'doctor.view',
      'bed.view', 'bed.assign',
      'sales_agent.view', 'sales_agent.assign',
      'report.view',
      'shift.manage',
      'shift.view',
      'reception.view',
      'reception.manage',
      'queue.issue_token',
      'queue.call_token',
      'queue.transfer_token',
      'billing.view',
      'billing.create',
      'billing.edit',
      'payment.collect',
      'diagnostic.view',
      'diagnostic.create',
      'diagnostic.edit',
      'sales_agent.create',
      'sales_agent.edit',
      'sales_agent.view_commission',
      'sales_agent.payout',
      'organization.view',
      'branch.view'
    ],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_accountant',
    code: 'ACCOUNTANT',
    name: 'Finance & Accounts Officer',
    description: 'Manages ledger, billing reconciliation, VAT reports, refunds, and daily cash closing',
    isSystemRole: true,
    permissions: ['invoice.view', 'invoice.create', 'invoice.edit', 'invoice.refund', 'billing.config', 'report.view', 'report.export'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_hr_manager',
    code: 'HR_MANAGER',
    name: 'Human Resources Manager',
    description: 'Oversees employee files, doctor credentials, department staffing, and payroll profiles',
    isSystemRole: true,
    permissions: ['user.view', 'user.create', 'user.edit', 'doctor.view', 'doctor.create', 'doctor.edit', 'department.manage'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_nurse',
    code: 'NURSE',
    name: 'Clinical Nurse',
    description: 'Assists with patient vitals, ward monitoring, bed allocations, and doctor triage',
    isSystemRole: true,
    permissions: ['patient.view', 'patient.edit', 'bed.view', 'queue.view', 'doctor.view'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_pharmacy_staff',
    code: 'PHARMACY_STAFF',
    name: 'Pharmacy Dispenser',
    description: 'Handles medication orders, invoice billing, and prescription fulfillment',
    isSystemRole: true,
    permissions: ['patient.view', 'invoice.view', 'invoice.create', 'service.manage'],
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'role_other_employee',
    code: 'OTHER_EMPLOYEE',
    name: 'General Hospital Employee',
    description: 'Base access role for logistics, maintenance, security, and cleaning staff',
    isSystemRole: true,
    permissions: ['bed.view', 'display.view'],
    createdAt: '2026-01-01T00:00:00Z'
  }
];
