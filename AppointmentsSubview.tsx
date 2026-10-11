import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Ticket,
  User,
  Stethoscope,
  Building2,
  X
} from 'lucide-react';
import { api } from '../../../services/api';
import { Appointment, Doctor, Patient } from '../../../types';
import { announceToken } from '../utils/speech';

interface AppointmentsSubviewProps {
  initialPatient?: Patient | null;
  onClearInitialPatient?: () => void;
}

export const AppointmentsSubview: React.FC<AppointmentsSubviewProps> = ({
  initialPatient,
  onClearInitialPatient
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    patientId: '',
    doctorId: '',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    type: 'CONSULTATION' as const,
    notes: ''
  });

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await api.reception.getAppointments({ date: selectedDate });
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDoctorsAndPatients = async () => {
    try {
      const docs = await api.getDoctors();
      setDoctors(docs);
      const pts = await api.reception.getPatients();
      setPatients(pts);
      if (docs.length > 0 && !bookingForm.doctorId) {
        setBookingForm(prev => ({ ...prev, doctorId: docs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load doctors/patients', err);
    }
  };

  useEffect(() => {
    loadAppointments();
    loadDoctorsAndPatients();
  }, [selectedDate]);

  useEffect(() => {
    if (initialPatient) {
      setBookingForm(prev => ({ ...prev, patientId: initialPatient.id }));
      setIsBookModalOpen(true);
    }
  }, [initialPatient]);

  const handleCheckIn = async (apt: Appointment) => {
    try {
      const res = await api.reception.checkInAppointment(apt.id);
      announceToken(res.queueEntry.tokenNumber, res.queueEntry.chamberNumber, apt.patientName);
      alert(`Patient checked in successfully! Token #${res.queueEntry.tokenNumber} assigned for Chamber ${res.queueEntry.chamberNumber}.`);
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patientId || !bookingForm.doctorId) {
      alert('Please select both patient and doctor');
      return;
    }

    try {
      await api.reception.createAppointment({
        patientId: bookingForm.patientId,
        doctorId: bookingForm.doctorId,
        date: bookingForm.date,
        timeSlot: bookingForm.timeSlot,
        type: bookingForm.type,
        notes: bookingForm.notes
      });
      setIsBookModalOpen(false);
      if (onClearInitialPatient) onClearInitialPatient();
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to book appointment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200">Checked In (Waiting)</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">In Consultation</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200">Scheduled</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Date selector & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
          </div>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition"
          >
            Today
          </button>
        </div>

        <button
          onClick={() => setIsBookModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Book New Appointment
        </button>
      </div>

      {/* Appointments List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-sm">Appointments Schedule</h3>
            <span className="bg-slate-100 text-slate-600 font-medium text-xs px-2.5 py-0.5 rounded-full">
              {appointments.length} booked
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-xs">No appointments scheduled for {selectedDate}</p>
            <p className="text-slate-400 text-xs mt-0.5">Click &quot;Book New Appointment&quot; to reserve a doctor slot.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Time Slot</th>
                  <th className="px-5 py-3">Patient Details</th>
                  <th className="px-5 py-3">Assigned Doctor</th>
                  <th className="px-5 py-3">Chamber</th>
                  <th className="px-5 py-3">Status & Token</th>
                  <th className="px-5 py-3 text-right">Check-in Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {apt.timeSlot}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{apt.appointmentNumber}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{apt.patientName}</div>
                      <div className="text-slate-500 text-[11px]">{apt.patientPhone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{apt.doctorName}</div>
                      <span className="text-[10px] text-teal-600 font-medium">Consultation Fee: ৳{apt.fee}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-sm bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                        Chamber {apt.chamberNumber || '101'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(apt.status)}
                        {apt.queueToken && (
                          <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            Token #{apt.queueToken}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {apt.status === 'SCHEDULED' ? (
                        <button
                          onClick={() => handleCheckIn(apt)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          Check-in & Token
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium italic">Checked-In</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Schedule Patient Appointment</h3>
              </div>
              <button
                onClick={() => {
                  setIsBookModalOpen(false);
                  if (onClearInitialPatient) onClearInitialPatient();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={bookingForm.patientId}
                  onChange={(e) => setBookingForm({ ...bookingForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.patientId}) - {p.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Doctor & Chamber *</label>
                <select
                  required
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.specialty} • Fee: ৳{d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Appointment Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                    <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                    <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                    <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                    <option value="05:00 PM - 05:30 PM">05:00 PM - 05:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visit Reason / Clinical Notes</label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="e.g. Follow up on blood test results and chest tightness"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
