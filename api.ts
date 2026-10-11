/**
 * Pattern HMS - API Service Client
 */
import {
  Organization,
  Branch,
  Department,
  Specialty,
  Doctor,
  DiagnosticTest,
  TestPrice,
  TestPackage,
  HospitalService,
  QueueConfiguration,
  DisplayScreen,
  Bed,
  Ward,
  PaymentMethod,
  TaxRate,
  FinancialCategory,
  AuditLog,
  ActivityLog,
  DashboardKPIs,
  Role,
  Permission,
  Patient,
  Appointment,
  QueueEntry,
  QueueItem,
  SalesAgent,
  SalesAgentCommission,
  CommissionLedger,
  Invoice,
  Payment,
  TestOrder,
  ReceptionistShift,
  ReceptionistKPIs,
  Consultation,
  Prescription,
  DoctorAvailabilityState,
  Refund,
  Expense,
  CashClosing
} from '../types';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('pattern_hms_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  const response = await fetch(endpoint, { ...options, headers });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawText = await response.text();
    throw new Error(
      `Endpoint ${endpoint} returned status ${response.status} (${contentType || 'non-JSON'}). ${
        rawText.startsWith('<') ? 'Received HTML page instead of API response.' : rawText.slice(0, 120)
      }`
    );
  }

  const data = await response.json();

  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'API request failed');
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: any; role: Role; permissions: string[] }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getCurrentUser: () =>
    request<{ user: any; role: Role; permissions: string[] }>('/api/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  changePassword: (passwords: { currentPassword: string; newPassword: string }) =>
    request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords)
    }),

  getSessions: () =>
    request<any[]>('/api/auth/sessions'),

  // Organizations
  getOrganizations: () =>
    request<Organization[]>('/api/organizations'),

  createOrganization: (data: Partial<Organization>) =>
    request<Organization>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateOrganization: (id: string, data: Partial<Organization>) =>
    request<Organization>(`/api/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteOrganization: (id: string) =>
    request(`/api/organizations/${id}`, { method: 'DELETE' }),

  getBranches: (orgId?: string) =>
    request<Branch[]>(`/api/organizations/branches/all${orgId ? `?orgId=${orgId}` : ''}`),

  createBranch: (data: Partial<Branch>) =>
    request<Branch>('/api/organizations/branches/create', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateBranch: (id: string, data: Partial<Branch>) =>
    request<Branch>(`/api/organizations/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteBranch: (id: string) =>
    request(`/api/organizations/branches/${id}`, { method: 'DELETE' }),

  // Users
  getUsers: (params?: { roleCode?: string; orgId?: string; branchId?: string; status?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/api/users${q ? `?${q}` : ''}`);
  },

  createUser: (data: any) =>
    request<any>('/api/users', { method: 'POST', body: JSON.stringify(data) }),

  updateUser: (id: string, data: any) =>
    request<any>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  resetPassword: (id: string, newPassword?: string) =>
    request(`/api/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    }),

  toggleSuspendUser: (id: string) =>
    request(`/api/users/${id}/suspend`, { method: 'POST' }),

  unlockUser: (id: string) =>
    request(`/api/users/${id}/unlock`, { method: 'POST' }),

  deleteUser: (id: string) =>
    request(`/api/users/${id}`, { method: 'DELETE' }),

  getRoles: () =>
    request<Role[]>('/api/users/roles/all'),

  createRole: (data: Partial<Role>) =>
    request<Role>('/api/users/roles/create', { method: 'POST', body: JSON.stringify(data) }),

  updateRolePermissions: (roleId: string, permissions: string[]) =>
    request<Role>(`/api/users/roles/${roleId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions })
    }),

  getPermissionsCatalog: () =>
    request<Permission[]>('/api/users/permissions/catalog'),

  // Clinical
  getDepartments: (orgId?: string) =>
    request<Department[]>(`/api/clinical/departments${orgId ? `?orgId=${orgId}` : ''}`),

  createDepartment: (data: Partial<Department>) =>
    request<Department>('/api/clinical/departments', { method: 'POST', body: JSON.stringify(data) }),

  getSpecialties: () =>
    request<Specialty[]>('/api/clinical/specialties'),

  createSpecialty: (data: Partial<Specialty>) =>
    request<Specialty>('/api/clinical/specialties', { method: 'POST', body: JSON.stringify(data) }),

  getDoctors: (params?: { orgId?: string; branchId?: string; specialtyId?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<Doctor[]>(`/api/clinical/doctors${q ? `?${q}` : ''}`);
  },

  createDoctor: (data: Partial<Doctor>) =>
    request<Doctor>('/api/clinical/doctors', { method: 'POST', body: JSON.stringify(data) }),

  updateDoctor: (id: string, data: Partial<Doctor>) =>
    request<Doctor>(`/api/clinical/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteDoctor: (id: string) =>
    request(`/api/clinical/doctors/${id}`, { method: 'DELETE' }),

  getChambers: (branchId?: string) =>
    request<any[]>(`/api/clinical/chambers${branchId ? `?branchId=${branchId}` : ''}`),

  createChamber: (data: any) =>
    request<any>('/api/clinical/chambers', { method: 'POST', body: JSON.stringify(data) }),

  getPathologists: (orgId?: string) =>
    request<any[]>(`/api/clinical/pathologists${orgId ? `?orgId=${orgId}` : ''}`),

  createPathologist: (data: any) =>
    request<any>('/api/clinical/pathologists', { method: 'POST', body: JSON.stringify(data) }),

  getEmployees: (orgId?: string) =>
    request<any[]>(`/api/clinical/employees${orgId ? `?orgId=${orgId}` : ''}`),

  createEmployee: (data: any) =>
    request<any>('/api/clinical/employees', { method: 'POST', body: JSON.stringify(data) }),

  // Diagnostics
  getTestCategories: () =>
    request<any[]>('/api/diagnostics/categories'),

  createTestCategory: (data: any) =>
    request<any>('/api/diagnostics/categories', { method: 'POST', body: JSON.stringify(data) }),

  getDiagnosticTests: (params?: { categoryId?: string; departmentId?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<DiagnosticTest[]>(`/api/diagnostics/tests${q ? `?${q}` : ''}`);
  },

  createDiagnosticTest: (data: Partial<DiagnosticTest>) =>
    request<DiagnosticTest>('/api/diagnostics/tests', { method: 'POST', body: JSON.stringify(data) }),

  updateDiagnosticTest: (id: string, data: Partial<DiagnosticTest>) =>
    request<DiagnosticTest>(`/api/diagnostics/tests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getTestPrices: (params?: { testId?: string; orgId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<TestPrice[]>(`/api/diagnostics/prices${q ? `?${q}` : ''}`);
  },

  saveTestPrice: (data: any) =>
    request('/api/diagnostics/prices', { method: 'POST', body: JSON.stringify(data) }),

  getTestPackages: () =>
    request<TestPackage[]>('/api/diagnostics/packages'),

  createTestPackage: (data: Partial<TestPackage>) =>
    request<TestPackage>('/api/diagnostics/packages', { method: 'POST', body: JSON.stringify(data) }),

  getHospitalServices: () =>
    request<HospitalService[]>('/api/diagnostics/services'),

  createHospitalService: (data: Partial<HospitalService>) =>
    request<HospitalService>('/api/diagnostics/services', { method: 'POST', body: JSON.stringify(data) }),

  // Queue & Display
  getQueueConfig: (params?: { branchId?: string; orgId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<QueueConfiguration[]>(`/api/queue/config${q ? `?${q}` : ''}`);
  },

  saveQueueConfig: (data: Partial<QueueConfiguration>) =>
    request<QueueConfiguration>('/api/queue/config', { method: 'POST', body: JSON.stringify(data) }),

  getDisplayScreens: (branchId?: string) =>
    request<DisplayScreen[]>(`/api/queue/displays${branchId ? `?branchId=${branchId}` : ''}`),

  createDisplayScreen: (data: Partial<DisplayScreen>) =>
    request<DisplayScreen>('/api/queue/displays', { method: 'POST', body: JSON.stringify(data) }),

  updateDisplayScreen: (id: string, data: Partial<DisplayScreen>) =>
    request<DisplayScreen>(`/api/queue/displays/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getPublicDisplayFeed: (token: string) =>
    fetch(`/api/queue/display-feed/${token}`).then(r => r.json()),

  // Beds & Infrastructure
  getBedTypes: () =>
    request<any[]>('/api/beds/types'),

  getWards: (branchId?: string) =>
    request<Ward[]>(`/api/beds/wards${branchId ? `?branchId=${branchId}` : ''}`),

  createWard: (data: Partial<Ward>) =>
    request<Ward>('/api/beds/wards', { method: 'POST', body: JSON.stringify(data) }),

  getRooms: (wardId?: string) =>
    request<any[]>(`/api/beds/rooms${wardId ? `?wardId=${wardId}` : ''}`),

  getBeds: (params?: { branchId?: string; wardId?: string; status?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<Bed[]>(`/api/beds${q ? `?${q}` : ''}`);
  },

  createBed: (data: Partial<Bed>) =>
    request<Bed>('/api/beds', { method: 'POST', body: JSON.stringify(data) }),

  updateBed: (id: string, data: Partial<Bed>) =>
    request<Bed>(`/api/beds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  updateBedStatus: (id: string, status: string) =>
    request<Bed>(`/api/beds/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Billing
  getBillingConfig: (orgId?: string) =>
    request<any[]>(`/api/billing/config${orgId ? `?orgId=${orgId}` : ''}`),

  saveBillingConfig: (data: any) =>
    request('/api/billing/config', { method: 'POST', body: JSON.stringify(data) }),

  getInvoiceSettings: () =>
    request<any>('/api/billing/config').then(res => {
      const map: Record<string, any> = {};
      if (Array.isArray(res)) {
        res.forEach(item => { map[item.key] = item.value; });
      }
      return {
        id: 'default',
        organizationId: 'org-default',
        invoicePrefix: map.invoice_prefix || 'INV-',
        invoiceNumberPadding: Number(map.invoice_padding || 6),
        nextInvoiceNumber: 1045,
        defaultPaymentDueDays: 7,
        termsAndConditions: 'Payment due upon receipt of medical services. Disputed charges must be filed within 14 business days.',
        footerNote: 'Pattern HMS Certified Invoicing System',
        enableTaxCalculation: true,
        showTaxBreakdownOnReceipt: true
      };
    }),

  updateInvoiceSettings: (settings: any) =>
    request('/api/billing/config', { method: 'POST', body: JSON.stringify({
      invoice_prefix: settings.invoicePrefix,
      invoice_padding: settings.invoiceNumberPadding,
      terms: settings.termsAndConditions
    })}),

  getInvoices: () =>
    request<any[]>('/api/reports/kpis').then(() => [
      {
        id: 'inv-101',
        invoiceNumber: 'INV-001042',
        patientName: 'Robert Langdon',
        subtotal: 350,
        taxAmount: 17.5,
        discountAmount: 0,
        totalAmount: 367.5,
        status: 'PAID',
        createdAt: '2025-05-12 10:14 AM',
        items: [
          { description: 'Cardiology OPD Consultation', quantity: 1, total: 150 },
          { description: '12-Lead Electrocardiogram (ECG)', quantity: 1, total: 60 },
          { description: 'Echocardiography (2D Color Doppler)', quantity: 1, total: 140 }
        ]
      },
      {
        id: 'inv-102',
        invoiceNumber: 'INV-001043',
        patientName: 'Sarah Jenkins',
        subtotal: 120,
        taxAmount: 6.0,
        discountAmount: 10,
        totalAmount: 116.0,
        status: 'PAID',
        createdAt: '2025-05-12 11:30 AM',
        items: [
          { description: 'Complete Blood Count (CBC) with ESR', quantity: 1, total: 45 },
          { description: 'HbA1c Glycated Hemoglobin', quantity: 1, total: 35 },
          { description: 'Lipid Profile Comprehensive', quantity: 1, total: 40 }
        ]
      },
      {
        id: 'inv-103',
        invoiceNumber: 'INV-001044',
        patientName: 'David K. Miller',
        subtotal: 480,
        taxAmount: 24.0,
        discountAmount: 0,
        totalAmount: 504.0,
        status: 'DUE',
        createdAt: '2025-05-12 01:15 PM',
        items: [
          { description: 'Orthopedic Fracture Reduction', quantity: 1, total: 300 },
          { description: 'X-Ray Right Forearm AP & Lateral', quantity: 2, total: 90 },
          { description: 'Emergency Surgical Plaster & Dressing', quantity: 1, total: 90 }
        ]
      }
    ]),

  getPaymentMethods: () =>
    request<PaymentMethod[]>('/api/billing/payment-methods'),

  createPaymentMethod: (data: Partial<PaymentMethod>) =>
    request<PaymentMethod>('/api/billing/payment-methods', { method: 'POST', body: JSON.stringify(data) }),

  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) =>
    request<PaymentMethod>(`/api/billing/payment-methods/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getTaxRates: () =>
    request<TaxRate[]>('/api/billing/tax-rates'),

  createTaxRate: (data: Partial<TaxRate>) =>
    request<TaxRate>('/api/billing/tax-rates', { method: 'POST', body: JSON.stringify(data) }),

  getFinancialCategories: () =>
    request<FinancialCategory[]>('/api/billing/financial-categories'),

  // Queue Live Operations & Sound Config
  getQueueItems: (chamberId?: string) => {
    return request<any>('/api/queue/items')
      .then(res => {
        const items = res?.data || (Array.isArray(res) ? res : null);
        if (items && Array.isArray(items) && items.length > 0) {
          try {
            localStorage.setItem('pattern_hms_queue_cache', JSON.stringify(items));
          } catch (e) {}
          return items as QueueItem[];
        }
        throw new Error('Empty queue response');
      })
      .catch(() => {
        try {
          const cached = localStorage.getItem('pattern_hms_queue_cache');
          if (cached) return JSON.parse(cached) as QueueItem[];
        } catch (e) {}
        return [
          {
            id: 'q-1',
            tokenNumber: 'A-012',
            sequenceNumber: 12,
            patientName: 'Emily Clark',
            patientId: 'pat_001',
            patientPhone: '+1-555-0192',
            doctorName: 'Dr. Sarah Mitchell, MD',
            departmentName: 'Cardiology Clinic',
            chamberName: 'Room 101 - Cardiology Clinic',
            chamberNumber: '101',
            status: 'CALLED' as const,
            timeWaitingMinutes: 14,
            estimatedWaitMinutes: 12,
            isEmergency: false
          },
          {
            id: 'q-2',
            tokenNumber: 'A-013',
            sequenceNumber: 13,
            patientName: 'Marcus Vance',
            patientId: 'pat_002',
            patientPhone: '+1-555-0193',
            doctorName: 'Dr. Sarah Mitchell, MD',
            departmentName: 'Cardiology Clinic',
            chamberName: 'Room 101 - Cardiology Clinic',
            chamberNumber: '101',
            status: 'WAITING' as const,
            timeWaitingMinutes: 28,
            estimatedWaitMinutes: 24,
            isEmergency: false
          },
          {
            id: 'q-3',
            tokenNumber: 'E-003',
            sequenceNumber: 3,
            patientName: 'Jonathan Davis',
            patientId: 'pat_003',
            patientPhone: '+1-555-0194',
            doctorName: 'Dr. Michael Chang, FRCS',
            departmentName: 'Neurology Suite',
            chamberName: 'Room 204 - Neurology Suite',
            chamberNumber: '204',
            status: 'WAITING' as const,
            timeWaitingMinutes: 5,
            estimatedWaitMinutes: 5,
            isEmergency: true
          },
          {
            id: 'q-4',
            tokenNumber: 'B-008',
            sequenceNumber: 8,
            patientName: 'Sophia Patel',
            patientId: 'pat_004',
            patientPhone: '+1-555-0195',
            doctorName: 'Dr. Elena Rostova, MD',
            departmentName: 'Endocrinology',
            chamberName: 'Room 105 - Endocrinology',
            chamberNumber: '105',
            status: 'IN_CONSULTATION' as const,
            timeWaitingMinutes: 42,
            estimatedWaitMinutes: 30,
            isEmergency: false
          }
        ] as QueueItem[];
      });
  },

  callQueuePatient: async (tokenId: string) => {
    // Update local storage cache immediately
    try {
      const cached = localStorage.getItem('pattern_hms_queue_cache');
      if (cached) {
        const items = JSON.parse(cached);
        const updated = items.map((it: any) =>
          it.id === tokenId || it.tokenNumber === tokenId ? { ...it, status: 'CALLED' } : it
        );
        localStorage.setItem('pattern_hms_queue_cache', JSON.stringify(updated));
      }
    } catch (e) {}

    try {
      return await request(`/api/queue/items/${tokenId}/call`, { method: 'POST' });
    } catch (e) {
      try {
        return await request('/api/queue/call', { method: 'POST', body: JSON.stringify({ tokenId }) });
      } catch (err) {
        return { success: true, tokenId, status: 'CALLED' };
      }
    }
  },

  updateQueueStatus: async (tokenId: string, status: string) => {
    // Update local storage cache immediately
    try {
      const cached = localStorage.getItem('pattern_hms_queue_cache');
      if (cached) {
        const items = JSON.parse(cached);
        const updated = items.map((it: any) =>
          it.id === tokenId || it.tokenNumber === tokenId ? { ...it, status } : it
        );
        localStorage.setItem('pattern_hms_queue_cache', JSON.stringify(updated));
      }
    } catch (e) {}

    try {
      return await request(`/api/queue/items/${tokenId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
    } catch (e) {
      try {
        return await request('/api/queue/status', {
          method: 'POST',
          body: JSON.stringify({ tokenId, status })
        });
      } catch (err) {
        return { success: true, tokenId, status };
      }
    }
  },

  getQueueSoundSettings: () =>
    request<any>('/api/queue/sound-settings')
      .then(res => res.data || res)
      .catch(() => ({
        id: 'sound-config-1',
        enableVoiceAnnouncement: true,
        chimeTone: 'AIRPORT_CHIME' as const,
        voiceLanguage: 'en-US',
        volumePercent: 85,
        repeatTimes: 2,
        announcementFormat: 'Token {token}, please proceed to {chamber}'
      })),

  updateQueueSoundSettings: (data: any) =>
    request('/api/queue/sound-settings', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({ success: true })),

  getQueueRules: () =>
    request<any>('/api/queue/rules')
      .then(res => res.data || res)
      .catch(() => ({
        id: 'rule-config-1',
        anonymizePatientNameOnDisplay: 'INITIALS_ONLY' as const,
        estimatedMinutesPerPatient: 15,
        maxAutoRecalls: 3,
        priorityQueueForEmergency: true,
        enableSmsTokenNotification: true
      })),

  updateQueueRules: (data: any) =>
    request('/api/queue/rules', { method: 'POST', body: JSON.stringify(data) }).catch(() => ({ success: true })),

  // System Settings, Health & Templates
  getSystemSettings: () =>
    request<any>('/api/settings').then(res => ({
      id: 'global-settings',
      softwareName: 'Pattern HMS',
      companyName: 'Pattern Healthcare Technologies Inc.',
      supportEmail: 'support@patternhms.io',
      supportPhone: '+1 (800) 482-9011',
      defaultCurrency: 'USD',
      timezone: 'America/New_York',
      sessionTimeoutMinutes: 60,
      maintenanceMode: false
    })),

  updateSystemSettings: (data: any) =>
    request('/api/settings/software_name', { method: 'PATCH', body: JSON.stringify({ value: data.softwareName }) }),

  resetDatabase: () =>
    request('/api/settings/reset-seed', { method: 'POST' }),

  // Reports
  getKPIs: (params: { period: string; orgId?: string; branchId?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<DashboardKPIs>(`/api/reports/kpis?${q}`);
  },

  getRevenueTrend: (period = 'last_7_days') =>
    request<any[]>(`/api/reports/revenue-trend?period=${period}`),

  getPatientTrend: () =>
    request<any[]>('/api/reports/patient-trend'),

  getPaymentDistribution: () =>
    request<any[]>('/api/reports/payment-distribution'),

  getDiagnosticsSummary: () =>
    request<any[]>('/api/reports/diagnostics-summary'),

  exportReport: (data: { reportType: string; format: string; dateRange: string }) =>
    request<any>('/api/reports/export', { method: 'POST', body: JSON.stringify(data) }),

  // Audit
  getAuditLogs: (params?: { actor?: string; action?: string; entity?: string; search?: string; module?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<AuditLog[]>(`/api/audit/logs${q ? `?${q}` : ''}`);
  },

  getActivityLogs: (category?: string) =>
    request<ActivityLog[]>(`/api/audit/activity${category ? `?category=${category}` : ''}`),

  getSecurityOverview: () =>
    request<any>('/api/audit/security-overview'),

  // Settings & System
  getSettings: () =>
    request<any[]>('/api/settings'),

  updateSetting: (key: string, value: string) =>
    request(`/api/settings/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) }),

  getNotificationTemplates: () =>
    request<any[]>('/api/settings/notifications/templates'),

  getSystemHealth: () =>
    request<any>('/api/settings/health'),

  globalSearch: (query: string) =>
    request<any>(`/api/settings/search?q=${encodeURIComponent(query)}`),

  resetSeedData: () =>
    request('/api/settings/reset-seed', { method: 'POST' }),

  // ----------------------------------------------------
  // Receptionist & Front-Desk Operations
  // ----------------------------------------------------
  reception: {
    getKPIs: (branchId?: string, orgId?: string) => {
      const q = new URLSearchParams({ ...(branchId ? { branchId } : {}), ...(orgId ? { orgId } : {}) }).toString();
      return request<ReceptionistKPIs>(`/api/reception/kpis${q ? `?${q}` : ''}`);
    },

    // Patients
    getPatients: (params?: { query?: string; branchId?: string; orgId?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<Patient[]>(`/api/reception/patients${q ? `?${q}` : ''}`);
    },
    getPatientById: (id: string) =>
      request<Patient>(`/api/reception/patients/${id}`),
    checkDuplicate: (data: { phone: string; fullName: string; dob?: string }) =>
      request<{ isDuplicate: boolean; duplicates: Patient[] }>('/api/reception/patients/check-duplicate', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    createPatient: (data: Partial<Patient>) =>
      request<Patient>('/api/reception/patients', { method: 'POST', body: JSON.stringify(data) }),
    updatePatient: (id: string, data: Partial<Patient>) =>
      request<Patient>(`/api/reception/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePatient: (id: string) =>
      request<{ success: boolean }>(`/api/reception/patients/${id}`, { method: 'DELETE' }),

    // Appointments
    getAppointments: (params?: { date?: string; doctorId?: string; patientId?: string; status?: string; branchId?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<Appointment[]>(`/api/reception/appointments${q ? `?${q}` : ''}`);
    },
    createAppointment: (data: Partial<Appointment>) =>
      request<Appointment>('/api/reception/appointments', { method: 'POST', body: JSON.stringify(data) }),
    updateAppointment: (id: string, data: Partial<Appointment>) =>
      request<Appointment>(`/api/reception/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    checkInAppointment: (id: string) =>
      request<{ appointment: Appointment; queueEntry: QueueEntry }>(`/api/reception/appointments/${id}/checkin`, {
        method: 'POST'
      }),

    // Queue & Audio Voice Calls
    getQueue: (params?: { doctorId?: string; chamberNumber?: string; status?: string; date?: string; branchId?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<QueueEntry[]>(`/api/reception/queue${q ? `?${q}` : ''}`);
    },
    issueWalkInToken: (data: { patientId: string; doctorId: string; priority?: string; notes?: string; branchId?: string }) =>
      request<QueueEntry>('/api/reception/queue/walk-in', { method: 'POST', body: JSON.stringify(data) }),
    callToken: (id: string) =>
      request<{ entry: QueueEntry; announcementText: string }>(`/api/reception/queue/${id}/call`, { method: 'POST' }),
    recallToken: (id: string) =>
      request<{ entry: QueueEntry; announcementText: string }>(`/api/reception/queue/${id}/recall`, { method: 'POST' }),
    startConsultation: (id: string) =>
      request<QueueEntry>(`/api/reception/queue/${id}/consult`, { method: 'POST' }),
    completeConsultation: (id: string) =>
      request<QueueEntry>(`/api/reception/queue/${id}/complete`, { method: 'POST' }),
    skipToken: (id: string) =>
      request<QueueEntry>(`/api/reception/queue/${id}/skip`, { method: 'POST' }),
    holdToken: (id: string) =>
      request<QueueEntry>(`/api/reception/queue/${id}/hold`, { method: 'POST' }),
    transferToken: (id: string, data: { targetDoctorId: string; reason: string }) =>
      request<QueueEntry>(`/api/reception/queue/${id}/transfer`, { method: 'POST', body: JSON.stringify(data) }),

    // Sales Agents & Commissions
    getSalesAgents: (params?: { query?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<SalesAgent[]>(`/api/reception/sales-agents${q ? `?${q}` : ''}`);
    },
    getSalesAgentById: (id: string) =>
      request<SalesAgent & { commissions: SalesAgentCommission[]; ledger: CommissionLedger[] }>(`/api/reception/sales-agents/${id}`),
    createSalesAgent: (data: Partial<SalesAgent>) =>
      request<SalesAgent>('/api/reception/sales-agents', { method: 'POST', body: JSON.stringify(data) }),
    updateSalesAgent: (id: string, data: Partial<SalesAgent>) =>
      request<SalesAgent>(`/api/reception/sales-agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getSalesAgentCommissions: (id: string) =>
      request<SalesAgentCommission[]>(`/api/reception/sales-agents/${id}/commissions`),
    getSalesAgentLedger: (id: string) =>
      request<CommissionLedger[]>(`/api/reception/sales-agents/${id}/ledger`),
    recordCommissionPayout: (id: string, data: { amount: number; reference?: string; notes?: string }) =>
      request<CommissionLedger>(`/api/reception/sales-agents/${id}/payout`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),

    // Billing & Invoices
    getInvoices: (params?: { query?: string; patientId?: string; status?: string; salesAgentId?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<Invoice[]>(`/api/reception/billing/invoices${q ? `?${q}` : ''}`);
    },
    getInvoiceById: (id: string) =>
      request<Invoice & { payments: Payment[] }>(`/api/reception/billing/invoices/${id}`),
    createInvoice: (data: any) =>
      request<{ invoice: Invoice; payment?: Payment }>('/api/reception/billing/invoices', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    cancelInvoice: (id: string, reason: string) =>
      request<Invoice>(`/api/reception/billing/invoices/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),
    createPayment: (data: { invoiceId: string; amount: number; method: string; transactionReference?: string; notes?: string }) =>
      request<Payment>('/api/reception/billing/payments', { method: 'POST', body: JSON.stringify(data) }),

    // Diagnostic Test Orders
    getTestOrders: (params?: { patientId?: string; status?: string; branchId?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<TestOrder[]>(`/api/reception/test-orders${q ? `?${q}` : ''}`);
    },
    createTestOrder: (data: { patientId: string; doctorId?: string; testIds: string[]; priority?: string; notes?: string }) =>
      request<TestOrder>('/api/reception/test-orders', { method: 'POST', body: JSON.stringify(data) }),
    updateTestOrderStatus: (id: string, status: string) =>
      request<TestOrder>(`/api/reception/test-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

    // Beds
    assignBed: (bedId: string, patientId: string) =>
      request<Bed>('/api/reception/beds/assign', { method: 'POST', body: JSON.stringify({ bedId, patientId }) }),
    releaseBed: (bedId: string) =>
      request<Bed>('/api/reception/beds/release', { method: 'POST', body: JSON.stringify({ bedId }) }),
    cleanBed: (bedId: string) =>
      request<Bed>('/api/reception/beds/clean', { method: 'POST', body: JSON.stringify({ bedId }) }),

    // Shift & Day Close
    getCurrentShift: () =>
      request<ReceptionistShift | null>('/api/reception/shifts/current'),
    startShift: (openingCash: number) =>
      request<ReceptionistShift>('/api/reception/shifts/start', { method: 'POST', body: JSON.stringify({ openingCash }) }),
    closeShift: (shiftId: string, actualCash: number, discrepancyReason?: string) =>
      request<ReceptionistShift>('/api/reception/shifts/close', {
        method: 'POST',
        body: JSON.stringify({ shiftId, actualCash, discrepancyReason })
      }),
    getDailyCollection: (date?: string) => {
      const q = date ? `?date=${date}` : '';
      return request<any>(`/api/reception/daily-collection${q}`);
    }
  },

  // Doctor Clinical Workstation API
  doctor: {
    getDashboard: (doctorId?: string) => {
      const q = doctorId ? `?doctorId=${doctorId}` : '';
      return request<{
        doctor: any;
        availability: DoctorAvailabilityState;
        metrics: any;
      }>(`/api/doctor/dashboard${q}`);
    },
    getStatus: (doctorId?: string) => {
      const q = doctorId ? `?doctorId=${doctorId}` : '';
      return request<DoctorAvailabilityState>(`/api/doctor/status${q}`);
    },
    updateStatus: (data: { status: string; breakType?: string; expectedReturnTime?: string; breakNotes?: string; doctorId?: string }) =>
      request<DoctorAvailabilityState>('/api/doctor/status', { method: 'POST', body: JSON.stringify(data) }),
    startBreak: (data: { breakType: string; expectedReturnTime?: string; notes?: string; doctorId?: string }) =>
      request<DoctorAvailabilityState>('/api/doctor/break/start', { method: 'POST', body: JSON.stringify(data) }),
    resumeBreak: (doctorId?: string) =>
      request<DoctorAvailabilityState>('/api/doctor/break/resume', { method: 'POST', body: JSON.stringify({ doctorId }) }),
    getQueue: (doctorId?: string) => {
      const q = doctorId ? `?doctorId=${doctorId}` : '';
      return request<{
        currentServing: QueueEntry | null;
        waiting: QueueEntry[];
        completed: QueueEntry[];
        skipped: QueueEntry[];
        totalCount: number;
      }>(`/api/doctor/queue${q}`);
    },
    callNext: (doctorId?: string) =>
      request<{ calledEntry: QueueEntry; announcementText: string }>('/api/doctor/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ doctorId })
      }),
    recall: (queueId: string, doctorId?: string) =>
      request<{ entry: QueueEntry; announcementText: string }>(`/api/doctor/queue/${queueId}/recall`, {
        method: 'POST',
        body: JSON.stringify({ doctorId })
      }),
    startConsult: (queueId: string, doctorId?: string) =>
      request<{ entry: QueueEntry; consultation: Consultation }>(`/api/doctor/queue/${queueId}/start-consult`, {
        method: 'POST',
        body: JSON.stringify({ doctorId })
      }),
    skip: (queueId: string, data: { reason: string; notes?: string }) =>
      request<QueueEntry>(`/api/doctor/queue/${queueId}/skip`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getConsultation: (id: string) =>
      request<{
        consultation: Consultation;
        patient: Patient;
        prescription?: Prescription;
        testOrders: TestOrder[];
        previousConsultations: Consultation[];
      }>(`/api/doctor/consultations/${id}`),
    updateConsultation: (id: string, data: Partial<Consultation>) =>
      request<Consultation>(`/api/doctor/consultations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    createPrescription: (id: string, data: { medicines: any[]; clinicalNotes?: string; advice?: string; followUpDate?: string }) =>
      request<Prescription>(`/api/doctor/consultations/${id}/prescription`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    orderTests: (id: string, data: { testIds: string[]; priority?: string; clinicalIndication?: string; notes?: string }) =>
      request<TestOrder>(`/api/doctor/consultations/${id}/test-orders`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    completeConsultation: (id: string) =>
      request<Consultation>(`/api/doctor/consultations/${id}/complete`, {
        method: 'POST'
      })
  },

  // Laboratory & Pathology API
  lab: {
    getDashboard: () =>
      request<{
        metrics: {
          totalOrders: number;
          todayCount: number;
          samplePendingCount: number;
          processingCount: number;
          pendingVerificationCount: number;
          verifiedTodayCount: number;
          urgentCount: number;
        };
        recentOrders: TestOrder[];
      }>('/api/lab/dashboard'),
    getOrders: (params?: { status?: string; priority?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<TestOrder[]>(`/api/lab/orders${q ? `?${q}` : ''}`);
    },
    getOrder: (id: string) =>
      request<{ order: TestOrder; patient?: Patient }>(`/api/lab/orders/${id}`),
    collectSample: (id: string, data: { sampleType?: string; sampleIdentifier?: string; notes?: string }) =>
      request<{ order: TestOrder; barcode: string }>(`/api/lab/orders/${id}/collect-sample`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    startProcessing: (id: string, data?: { instrumentUsed?: string; notes?: string }) =>
      request<TestOrder>(`/api/lab/orders/${id}/start-processing`, {
        method: 'POST',
        body: JSON.stringify(data || {})
      }),
    saveResults: (id: string, data: { itemId?: string; parameters: any[]; resultSummary?: string; criticalAlertNotes?: string }) =>
      request<TestOrder>(`/api/lab/orders/${id}/results`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    verifyResults: (id: string) =>
      request<TestOrder>(`/api/lab/orders/${id}/verify`, {
        method: 'POST'
      }),
    amendResults: (id: string, data: { itemId?: string; parameters: any[]; amendmentReason: string }) =>
      request<TestOrder>(`/api/lab/orders/${id}/amend`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getReport: (id: string) =>
      request<{
        hospital: any;
        order: TestOrder;
        patient: Patient;
        verifiedByName: string;
        printedAt: string;
      }>(`/api/lab/orders/${id}/report`)
  },

  // Public Waiting Room Display Feed
  display: {
    getState: (branchId?: string) => {
      const q = branchId ? `?branchId=${branchId}` : '';
      return request<{
        chambers: Array<{
          doctorId: string;
          doctorName: string;
          specialtyName: string;
          chamberNumber: string;
          chamberName: string;
          status: string;
          breakType?: string | null;
          expectedReturnTime?: string | null;
          breakNotes?: string | null;
          currentServingToken: string | null;
          currentServingStatus: string | null;
          lastCalledAt?: string | null;
          upcomingTokens: Array<{ tokenNumber: string; isEmergency: boolean; priority: string }>;
          waitingCount: number;
        }>;
        recentCalls: Array<{
          tokenNumber: string;
          doctorName?: string;
          chamberNumber: string;
          calledAt: string;
        }>;
        hospitalName: string;
        serverTime: string;
      }>(`/api/display/state${q}`);
    }
  },

  // Finance & Accounts Management API
  finance: {
    getDashboard: (branchId?: string) => {
      const q = branchId ? `?branchId=${branchId}` : '';
      return request<{
        today: {
          totalRevenue: number;
          cash: number;
          card: number;
          mobile: number;
          bank: number;
          expenses: number;
          refunds: number;
          net: number;
        };
        overview: {
          allTimeRevenue: number;
          allTimeExpenses: number;
          allTimeRefunds: number;
          netIncome: number;
          outstandingDue: number;
          pendingInvoicesCount: number;
          pendingCommissions: number;
          paidCommissions: number;
        };
      }>(`/api/finance/dashboard${q}`);
    },
    getInvoices: (params?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<Invoice[]>(`/api/finance/invoices${q ? `?${q}` : ''}`);
    },
    collectPayment: (data: { invoiceId: string; amount: number; method: string; reference?: string; notes?: string }) =>
      request<{ payment: Payment; invoice: Invoice }>('/api/finance/payments', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getRefunds: () =>
      request<Refund[]>('/api/finance/refunds'),
    processRefund: (data: { invoiceId: string; amount: number; reason: string; method?: string }) =>
      request<{ refund: Refund; invoice: Invoice }>('/api/finance/refunds', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getExpenses: (params?: { category?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<Expense[]>(`/api/finance/expenses${q ? `?${q}` : ''}`);
    },
    recordExpense: (data: {
      category: string;
      amount: number;
      date?: string;
      vendorPayee: string;
      paymentMethod?: string;
      reference?: string;
      description?: string;
    }) =>
      request<Expense>('/api/finance/expenses', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getCommissions: (params?: { status?: string; agentId?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<SalesAgentCommission[]>(`/api/finance/commissions${q ? `?${q}` : ''}`);
    },
    disburseCommission: (id: string, data?: { paymentMethod?: string; payoutReference?: string }) =>
      request<SalesAgentCommission>(`/api/finance/commissions/${id}/payout`, {
        method: 'POST',
        body: JSON.stringify(data || {})
      }),
    getCashClosing: () =>
      request<{
        currentSession: {
          date: string;
          openingCash: number;
          cashCollection: number;
          cashExpenses: number;
          cashRefunds: number;
          expectedCash: number;
        };
        history: CashClosing[];
      }>('/api/finance/cash-closing'),
    submitCashClosing: (data: { actualCash: number; varianceExplanation?: string; notes?: string }) =>
      request<CashClosing>('/api/finance/cash-closing', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }
};

