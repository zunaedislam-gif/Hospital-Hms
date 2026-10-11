import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  X,
  Stethoscope,
  Ticket,
  Receipt,
  HeartPulse
} from 'lucide-react';
import { api } from '../../../services/api';
import { Patient } from '../../../types';

interface PatientsSubviewProps {
  onIssueToken: (patient: Patient) => void;
  onBookAppointment: (patient: Patient) => void;
  onCreateInvoice: (patient: Patient) => void;
}

export const PatientsSubview: React.FC<PatientsSubviewProps> = ({
  onIssueToken,
  onBookAppointment,
  onCreateInvoice
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<Patient[] | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    dob: '',
    age: '',
    bloodGroup: 'UNKNOWN' as const,
    street: '',
    city: 'Dhaka',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRel: '',
    allergies: '',
    chronicDiseases: ''
  });

  const loadPatients = async (query?: string) => {
    setIsLoading(true);
    try {
      const data = await api.reception.getPatients({ query });
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePhoneBlur = async () => {
    if (formData.phone.length >= 7 && formData.fullName.length > 2) {
      try {
        const res = await api.reception.checkDuplicate({
          phone: formData.phone,
          fullName: formData.fullName,
          dob: formData.dob
        });
        if (res.isDuplicate && res.duplicates.length > 0) {
          setDuplicateWarning(res.duplicates);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.error('Duplicate check failed', err);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.age) {
      alert('Please fill in required fields (Name, Phone, Age)');
      return;
    }

    try {
      const newPt = await api.reception.createPatient({
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        dob: formData.dob,
        age: Number(formData.age),
        bloodGroup: formData.bloodGroup,
        address: {
          street: formData.street,
          city: formData.city,
          country: 'Bangladesh'
        },
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRel
        },
        medicalHistory: {
          allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
          chronicDiseases: formData.chronicDiseases ? formData.chronicDiseases.split(',').map(s => s.trim()) : []
        }
      });

      setIsNewModalOpen(false);
      setDuplicateWarning(null);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        gender: 'MALE',
        dob: '',
        age: '',
        bloodGroup: 'UNKNOWN',
        street: '',
        city: 'Dhaka',
        emergencyName: '',
        emergencyPhone: '',
        emergencyRel: '',
        allergies: '',
        chronicDiseases: ''
      });
      loadPatients();
      setSelectedPatient(newPt);
    } catch (err: any) {
      alert(err.message || 'Failed to register patient');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Patient ID, Name, or Phone (e.g., PAT-2026-000101 or +88017...)"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>
        <button
          onClick={() => {
            setDuplicateWarning(null);
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-xs transition shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Register New Patient
        </button>
      </div>

      {/* Patient List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-base">Patient Directory</h3>
            <span className="bg-teal-50 text-teal-700 font-medium text-xs px-2.5 py-0.5 rounded-full border border-teal-200">
              {patients.length} records
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Searching patient database...</div>
        ) : patients.length === 0 ? (
          <div className="py-12 text-center">
            <UserPlus className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-sm">No patients found</p>
            <p className="text-slate-400 text-xs mt-0.5">Try searching with a different phone or name, or click register.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Patient ID & Name</th>
                  <th className="px-5 py-3">Phone & Age</th>
                  <th className="px-5 py-3">Blood Group</th>
                  <th className="px-5 py-3">Visits & Due</th>
                  <th className="px-5 py-3">Registered Date</th>
                  <th className="px-5 py-3 text-right">Instant Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((pt) => (
                  <tr key={pt.id} className="hover:bg-slate-50/80 transition group">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{pt.fullName}</div>
                      <div className="text-xs font-mono text-teal-600 tracking-tight">{pt.patientId}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-slate-800 flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {pt.phone}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {pt.age} yrs • {pt.gender}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded-sm bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                        {pt.bloodGroup || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-slate-800">{pt.totalVisits || 1} visits</div>
                      {pt.outstandingBalance > 0 ? (
                        <div className="text-xs text-amber-600 font-semibold">৳{pt.outstandingBalance} Due</div>
                      ) : (
                        <div className="text-xs text-emerald-600 font-medium">No Due</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(pt.registeredAt || pt.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onIssueToken(pt)}
                          title="Issue Walk-in Queue Token"
                          className="p-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition border border-teal-200"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onBookAppointment(pt)}
                          title="Schedule Doctor Appointment"
                          className="p-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 transition border border-sky-200"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onCreateInvoice(pt)}
                          title="Generate Bill / Invoice"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedPatient(pt)}
                          className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Details Drawer / Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{selectedPatient.fullName}</h3>
                  <span className="px-2 py-0.5 rounded-sm bg-teal-50 text-teal-700 font-mono text-xs font-bold border border-teal-200">
                    {selectedPatient.patientId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Registered Patient Profile & Clinical Summary</p>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Age & Gender</span>
                  <span className="font-semibold text-slate-800">
                    {selectedPatient.age} yrs • {selectedPatient.gender}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Blood Group</span>
                  <span className="font-bold text-rose-600">{selectedPatient.bloodGroup || 'UNKNOWN'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">City</span>
                  <span className="font-medium text-slate-700">{selectedPatient.address?.city || 'Dhaka'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Total Visits</span>
                  <span className="font-semibold text-slate-800">{selectedPatient.totalVisits || 1}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Outstanding Due</span>
                  <span className="font-bold text-amber-600">৳{selectedPatient.outstandingBalance || 0}</span>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border border-slate-200 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Emergency Contact
                </h4>
                <div className="flex items-center justify-between text-slate-700">
                  <span>
                    <strong>{selectedPatient.emergencyContact?.name || 'Not provided'}</strong>
                    {selectedPatient.emergencyContact?.relationship ? ` (${selectedPatient.emergencyContact.relationship})` : ''}
                  </span>
                  <span className="font-mono text-slate-600">{selectedPatient.emergencyContact?.phone || '—'}</span>
                </div>
              </div>

              {/* Medical History */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                  Allergies & Chronic Conditions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedPatient.medicalHistory?.allergies?.length || 0) > 0 ? (
                    selectedPatient.medicalHistory?.allergies?.map((item, idx) => (
                      <span key={idx} className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-sm text-xs font-medium">
                        Allergy: {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No known drug/food allergies recorded.</span>
                  )}
                  {selectedPatient.medicalHistory?.chronicDiseases?.map((item, idx) => (
                    <span key={idx} className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-sm text-xs font-medium">
                      Condition: {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons inside Drawer */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    const pt = selectedPatient;
                    setSelectedPatient(null);
                    onIssueToken(pt);
                  }}
                  className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition"
                >
                  <Ticket className="w-4 h-4" /> Issue Walk-In Token
                </button>
                <button
                  onClick={() => {
                    const pt = selectedPatient;
                    setSelectedPatient(null);
                    onBookAppointment(pt);
                  }}
                  className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition"
                >
                  <Stethoscope className="w-4 h-4" /> Book Appointment
                </button>
                <button
                  onClick={() => {
                    const pt = selectedPatient;
                    setSelectedPatient(null);
                    onCreateInvoice(pt);
                  }}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition"
                >
                  <Receipt className="w-4 h-4" /> Create Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register New Patient Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">New Patient Registration</h3>
              </div>
              <button
                onClick={() => setIsNewModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {duplicateWarning && duplicateWarning.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Possible Duplicate Patient Found!</span>
                    <p className="mt-0.5 text-amber-700">
                      Found existing patient <strong>{duplicateWarning[0].fullName}</strong> ({duplicateWarning[0].patientId}) with phone {duplicateWarning[0].phone}. Please confirm before registering again.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    onBlur={handlePhoneBlur}
                    placeholder="e.g. Mohammad Rahim"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={handlePhoneBlur}
                    placeholder="+8801700000000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Age <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="130"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="35"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="UNKNOWN">Unknown</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="patient@example.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 block mb-2">Emergency Contact</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={formData.emergencyName}
                    onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                    placeholder="Contact Name"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="Contact Phone"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={formData.emergencyRel}
                    onChange={(e) => setFormData({ ...formData, emergencyRel: e.target.value })}
                    placeholder="Relationship (e.g. Spouse)"
                    className="px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Medical notes */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Known Allergies (comma separated)</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="Penicillin, Dust"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chronic Diseases</label>
                  <input
                    type="text"
                    value={formData.chronicDiseases}
                    onChange={(e) => setFormData({ ...formData, chronicDiseases: e.target.value })}
                    placeholder="Hypertension, Type 2 Diabetes"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
