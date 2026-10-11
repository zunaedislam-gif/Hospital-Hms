/**
 * Pattern HMS - Quick Action Entity Creation Modal
 */
import React, { useState } from 'react';
import { X, Stethoscope, FlaskConical, Building2, UserPlus, Tv, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { organizations, branches, refreshOrganizations } = useAuth();
  const { isBangla, tObj } = useLanguage();
  const [activeTab, setActiveTab] = useState<'doctor' | 'test' | 'organization' | 'user'>('doctor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [docForm, setDocForm] = useState({
    fullName: '',
    doctorId: '',
    medicalRegNumber: '',
    specialtyId: 'spec_cardio',
    organizationId: organizations[0]?.id || 'org_pch',
    branchId: branches[0]?.id || 'br_pch_main',
    consultationFee: 75,
    phone: '',
    email: '',
    experienceYears: 6
  });

  const [testForm, setTestForm] = useState({
    name: '',
    code: '',
    categoryId: 'tc_hema',
    basePrice: 40,
    sampleType: 'Venous Blood',
    turnaroundHours: 4,
    discountEligible: true
  });

  const [orgForm, setOrgForm] = useState({
    name: '',
    type: 'HOSPITAL' as const,
    registrationNumber: '',
    contactNumber: '',
    email: '',
    address: '',
    city: 'Metro City',
    country: 'United States',
    currency: 'USD'
  });

  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: 'Password@123',
    roleCode: 'HOSPITAL_ADMIN',
    organizationId: organizations[0]?.id || 'org_pch',
    designation: 'Department Administrator',
    phone: ''
  });

  if (!isOpen) return null;

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.createDoctor(docForm);
      setFeedback({ type: 'success', message: 'Doctor profile registered successfully!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create doctor' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.createDiagnosticTest(testForm);
      setFeedback({ type: 'success', message: 'Diagnostic test registered successfully!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to register test' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.createOrganization(orgForm);
      await refreshOrganizations();
      setFeedback({ type: 'success', message: 'Hospital organization created successfully!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create organization' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await api.createUser(userForm);
      setFeedback({ type: 'success', message: 'Staff member account created successfully!' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-semibold text-slate-900 text-base">
              {isBangla ? 'দ্রুত এন্ট্রি ফর্ম' : 'Quick Entity Creator'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBangla ? 'চিকিৎসক, প্যাথলজি টেস্ট বা হাসপাতাল তথ্য দ্রুত যুক্ত করুন' : 'Rapidly register medical staff, tests, or healthcare facilities'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Type Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          <button
            onClick={() => { setActiveTab('doctor'); setFeedback(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'doctor'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            {isBangla ? 'ডাক্তার প্রোফাইল' : 'Doctor Profile'}
          </button>
          <button
            onClick={() => { setActiveTab('test'); setFeedback(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'test'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            {isBangla ? 'ডায়াগনস্টিক টেস্ট' : 'Diagnostic Test'}
          </button>
          <button
            onClick={() => { setActiveTab('organization'); setFeedback(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'organization'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="w-4 h-4" />
            {isBangla ? 'হাসপাতাল প্রতিষ্ঠান' : 'Hospital Facility'}
          </button>
          <button
            onClick={() => { setActiveTab('user'); setFeedback(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'user'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            {isBangla ? 'স্টাফ অ্যাকাউন্ট' : 'Staff Account'}
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {/* TAB 1: DOCTOR */}
          {activeTab === 'doctor' && (
            <form onSubmit={handleCreateDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Emily Vance, MD"
                    value={docForm.fullName}
                    onChange={e => setDocForm({ ...docForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Medical Registration No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MED-REG-8921"
                    value={docForm.medicalRegNumber}
                    onChange={e => setDocForm({ ...docForm, medicalRegNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Facility</label>
                  <select
                    value={docForm.organizationId}
                    onChange={e => setDocForm({ ...docForm, organizationId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={docForm.consultationFee}
                    onChange={e => setDocForm({ ...docForm, consultationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="doctor@hospital.org"
                    value={docForm.email}
                    onChange={e => setDocForm({ ...docForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Direct Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 443-2199"
                    value={docForm.phone}
                    onChange={e => setDocForm({ ...docForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  {isSubmitting ? 'Registering...' : 'Create Doctor Profile'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: DIAGNOSTIC TEST */}
          {activeTab === 'test' && (
            <form onSubmit={handleCreateTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Serum Ferritin"
                    value={testForm.name}
                    onChange={e => setTestForm({ ...testForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Test Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FER-SRM"
                    value={testForm.code}
                    onChange={e => setTestForm({ ...testForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sample Type</label>
                  <input
                    type="text"
                    value={testForm.sampleType}
                    onChange={e => setTestForm({ ...testForm, sampleType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Turnaround (Hrs)</label>
                  <input
                    type="number"
                    value={testForm.turnaroundHours}
                    onChange={e => setTestForm({ ...testForm, turnaroundHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    required
                    value={testForm.basePrice}
                    onChange={e => setTestForm({ ...testForm, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  {isSubmitting ? 'Registering...' : 'Register Diagnostic Test'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: HOSPITAL */}
          {activeTab === 'organization' && (
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Facility Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Northside Specialty Hospital"
                    value={orgForm.name}
                    onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Facility Type</label>
                  <select
                    value={orgForm.type}
                    onChange={e => setOrgForm({ ...orgForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="HOSPITAL">General Hospital</option>
                    <option value="DIAGNOSTIC_CENTER">Diagnostic Center</option>
                    <option value="CLINIC">Daycare Clinic</option>
                    <option value="MEDICAL_CENTER">Comprehensive Medical Center</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Govt Registration / License *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MOH-HOSP-2026-99"
                    value={orgForm.registrationNumber}
                    onChange={e => setOrgForm({ ...orgForm, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    value={orgForm.city}
                    onChange={e => setOrgForm({ ...orgForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  {isSubmitting ? 'Creating...' : 'Provision Hospital Facility'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: USER */}
          {activeTab === 'user' && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={userForm.fullName}
                    onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@hospital.org"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">System Role (RBAC) *</label>
                  <select
                    value={userForm.roleCode}
                    onChange={e => setUserForm({ ...userForm, roleCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                    <option value="BRANCH_ADMIN">Branch Administrator</option>
                    <option value="DOCTOR">Doctor / Consultant</option>
                    <option value="RECEPTIONIST">Front-desk Receptionist</option>
                    <option value="PATHOLOGIST">Pathologist / Lab Director</option>
                    <option value="LAB_TECHNICIAN">Laboratory Technician</option>
                    <option value="BILLING_OFFICER">Billing & Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={userForm.designation}
                    onChange={e => setUserForm({ ...userForm, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  {isSubmitting ? 'Creating...' : 'Provision Staff Account'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
