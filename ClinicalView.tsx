/**
 * Pattern HMS - Clinical Configuration View
 * Doctors, Specialties, Departments, Chambers, Pathologists & Employees
 */
import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  UserCheck,
  Building2,
  FolderTree,
  FlaskConical,
  Award,
  Layers,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Doctor, Specialty, Department } from '../types';

export const ClinicalView: React.FC = () => {
  const { organizations, branches } = useAuth();
  const [activeTab, setActiveTab] = useState<'doctors' | 'specialties' | 'departments' | 'chambers' | 'pathologists'>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [chambers, setChambers] = useState<any[]>([]);
  const [pathologists, setPathologists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isChamberModalOpen, setIsChamberModalOpen] = useState(false);

  // Forms
  const [doctorForm, setDoctorForm] = useState<Partial<Doctor>>({
    fullName: '',
    doctorId: '',
    medicalRegNumber: '',
    specialtyId: '',
    qualifications: '',
    experienceYears: 5,
    gender: 'MALE',
    phone: '',
    email: '',
    organizationId: organizations[0]?.id || '',
    branchId: branches[0]?.id || '',
    departmentId: '',
    consultationFee: 50,
    followUpFee: 25,
    emergencyFee: 100,
    chamberId: '',
    status: 'AVAILABLE'
  });

  const [specialtyForm, setSpecialtyForm] = useState({ name: '', code: '', description: '' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', headOfDepartment: '', organizationId: organizations[0]?.id || '' });
  const [chamberForm, setChamberForm] = useState({ name: '', number: '', branchId: branches[0]?.id || '', departmentId: '' });

  const loadAll = async () => {
    try {
      const [docs, specs, depts, chams, paths] = await Promise.all([
        api.getDoctors(),
        api.getSpecialties(),
        api.getDepartments(),
        api.getChambers(),
        api.getPathologists()
      ]);
      setDoctors(docs);
      setSpecialties(specs);
      setDepartments(depts);
      setChambers(chams);
      setPathologists(paths);
      if (specs.length > 0 && !doctorForm.specialtyId) {
        setDoctorForm(prev => ({ ...prev, specialtyId: specs[0].id }));
      }
    } catch (e) {
      console.error('Failed to load clinical config', e);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDoctor(doctorForm);
      await loadAll();
      setIsDoctorModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error registering doctor');
    }
  };

  const handleUpdateDoctorStatus = async (doctor: Doctor, newStatus: any) => {
    try {
      await api.updateDoctor(doctor.id, { status: newStatus });
      await loadAll();
    } catch (e: any) {
      alert(e.message || 'Error updating status');
    }
  };

  const handleCreateSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSpecialty(specialtyForm);
      await loadAll();
      setIsSpecialtyModalOpen(false);
      setSpecialtyForm({ name: '', code: '', description: '' });
    } catch (err: any) {
      alert(err.message || 'Error creating specialty');
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDepartment(deptForm);
      await loadAll();
      setIsDepartmentModalOpen(false);
      setDeptForm({ name: '', code: '', description: '', headOfDepartment: '', organizationId: organizations[0]?.id || '' });
    } catch (err: any) {
      alert(err.message || 'Error creating department');
    }
  };

  const handleCreateChamber = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createChamber(chamberForm);
      await loadAll();
      setIsChamberModalOpen(false);
      setChamberForm({ name: '', number: '', branchId: branches[0]?.id || '', departmentId: '' });
    } catch (err: any) {
      alert(err.message || 'Error creating chamber');
    }
  };

  const filteredDoctors = doctors.filter(d => {
    if (specialtyFilter !== 'ALL' && d.specialtyId !== specialtyFilter) return false;
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.doctorId.toLowerCase().includes(q) ||
        d.medicalRegNumber.toLowerCase().includes(q) ||
        d.specialtyName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getDoctorStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Available</span>;
      case 'BUSY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">With Patient</span>;
      case 'ON_BREAK':
      case 'PRAYER_BREAK':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">On Break</span>;
      case 'ON_LEAVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">On Leave</span>;
      case 'OFF_DUTY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Off Duty</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Clinical Services & Doctors</h1>
          <p className="text-xs text-slate-500">
            Medical practitioners, weekly consultation schedules, consultation chambers, and specialties
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'doctors' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doctors Roster
            </button>
            <button
              onClick={() => setActiveTab('specialties')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'specialties' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Specialties
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'departments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => setActiveTab('chambers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'chambers' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chambers
            </button>
            <button
              onClick={() => setActiveTab('pathologists')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'pathologists' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pathologists
            </button>
          </div>

          {activeTab === 'doctors' && (
            <button
              onClick={() => setIsDoctorModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Doctor
            </button>
          )}
          {activeTab === 'specialties' && (
            <button
              onClick={() => setIsSpecialtyModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Specialty
            </button>
          )}
          {activeTab === 'departments' && (
            <button
              onClick={() => setIsDepartmentModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Department
            </button>
          )}
          {activeTab === 'chambers' && (
            <button
              onClick={() => setIsChamberModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Chamber
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: DOCTORS */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search doctors by name, license, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={specialtyFilter}
                onChange={e => setSpecialtyFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="ALL">All Specialties</option>
                {specialties.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="BUSY">With Patient</option>
                <option value="ON_BREAK">On Break</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="OFF_DUTY">Off Duty</option>
              </select>
            </div>
          </div>

          {/* Doctors Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Doctor / Consultant</th>
                    <th className="py-3 px-4">Specialty & Reg</th>
                    <th className="py-3 px-4">Chamber & Facility</th>
                    <th className="py-3 px-4">Fees Schedule</th>
                    <th className="py-3 px-4">Weekly Schedule</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Quick Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDoctors.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs">
                            {doc.fullName.replace('Dr. ', '').charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{doc.fullName}</div>
                            <div className="text-[10px] text-slate-500">{doc.qualifications} • Exp: {doc.experienceYears} yrs</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                          {doc.specialtyName || 'Specialist'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">Reg: {doc.medicalRegNumber}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{doc.chamberName}</div>
                        <div className="text-[10px] text-slate-400">{doc.organizationName} • {doc.branchName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-teal-700">${doc.consultationFee} <span className="text-[10px] text-slate-400 font-normal">First Visit</span></div>
                        <div className="text-[10px] text-slate-500">${doc.followUpFee} Follow-up • ${doc.emergencyFee} ER</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {doc.schedule?.slice(0, 2).map((s, idx) => (
                            <div key={idx} className="text-[10px] text-slate-600 flex items-center gap-1">
                              <span className="font-semibold text-slate-800">{s.day}:</span>
                              <span>{s.startTime}-{s.endTime}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getDoctorStatusBadge(doc.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={doc.status}
                          onChange={(e) => handleUpdateDoctorStatus(doc, e.target.value)}
                          className="px-2 py-1 text-[11px] font-semibold border border-slate-300 rounded-md focus:ring-teal-500 bg-white text-slate-700"
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="BUSY">With Patient</option>
                          <option value="ON_BREAK">On Break</option>
                          <option value="PRAYER_BREAK">Prayer Break</option>
                          <option value="ON_LEAVE">On Leave</option>
                          <option value="OFF_DUTY">Off Duty</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPECIALTIES */}
      {activeTab === 'specialties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialties.map(spec => (
            <div key={spec.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{spec.name}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-bold">{spec.code}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{spec.description}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-700 font-semibold">
                <span>Active Clinical Specialty</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map(dept => (
            <div key={dept.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{dept.name}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-bold">{dept.code}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{dept.description}</p>
              <div className="text-xs text-slate-700">
                <span className="font-semibold text-slate-500">Head of Dept:</span> {dept.headOfDepartment || 'Unassigned'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CHAMBERS */}
      {activeTab === 'chambers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chambers.map(cham => (
            <div key={cham.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{cham.name}</div>
                  <div className="text-[11px] text-slate-500">Chamber #{cham.number}</div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                  {cham.status}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <div>Current Queue Token: <span className="font-bold font-mono text-teal-700">{cham.currentQueueToken || 'None Active'}</span></div>
                <div className="text-[10px] text-slate-400">Linked to digital waiting room screen</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: PATHOLOGISTS */}
      {activeTab === 'pathologists' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pathologist</th>
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4">Laboratory Unit</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pathologists.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="text-xs font-bold text-slate-900">{p.fullName}</div>
                    <div className="text-[10px] text-slate-500">{p.qualification} • {p.specialty}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{p.registrationNumber}</td>
                  <td className="py-3.5 px-4 text-slate-700">{p.laboratoryName}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div>{p.contactPhone}</div>
                    <div className="text-[10px] text-slate-400">{p.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Doctor */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Register Medical Practitioner</h3>
              <button onClick={() => setIsDoctorModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateDoctor} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Arthur Pendelton, MD"
                    value={doctorForm.fullName}
                    onChange={e => setDoctorForm({ ...doctorForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Registration No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. REG-BMDC-8492"
                    value={doctorForm.medicalRegNumber}
                    onChange={e => setDoctorForm({ ...doctorForm, medicalRegNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Specialty *</label>
                  <select
                    value={doctorForm.specialtyId}
                    onChange={e => setDoctorForm({ ...doctorForm, specialtyId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                  >
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Facility</label>
                  <select
                    value={doctorForm.organizationId}
                    onChange={e => setDoctorForm({ ...doctorForm, organizationId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                  >
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={doctorForm.consultationFee}
                    onChange={e => setDoctorForm({ ...doctorForm, consultationFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Email</label>
                  <input
                    type="email"
                    value={doctorForm.email}
                    onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Phone</label>
                  <input
                    type="text"
                    value={doctorForm.phone}
                    onChange={e => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Degrees & Qualifications</label>
                <input
                  type="text"
                  placeholder="e.g. MBBS, FCPS (Medicine), FRCP (Edin)"
                  value={doctorForm.qualifications}
                  onChange={e => setDoctorForm({ ...doctorForm, qualifications: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  Save Doctor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Specialty */}
      {isSpecialtyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Clinical Specialty</h3>
            <form onSubmit={handleCreateSpecialty} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Endocrinology"
                  value={specialtyForm.name}
                  onChange={e => setSpecialtyForm({ ...specialtyForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENDO"
                  value={specialtyForm.code}
                  onChange={e => setSpecialtyForm({ ...specialtyForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={specialtyForm.description}
                  onChange={e => setSpecialtyForm({ ...specialtyForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSpecialtyModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                >
                  Create Specialty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
