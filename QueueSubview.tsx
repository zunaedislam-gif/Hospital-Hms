import React, { useState, useEffect } from 'react';
import {
  Tv,
  Volume2,
  PhoneCall,
  RotateCcw,
  CheckCircle,
  Play,
  SkipForward,
  Pause,
  ArrowRightLeft,
  Plus,
  AlertTriangle,
  User,
  Stethoscope,
  X
} from 'lucide-react';
import { api } from '../../../services/api';
import { QueueEntry, Doctor, Patient, QueuePriority } from '../../../types';
import { announceToken } from '../utils/speech';

interface QueueSubviewProps {
  initialPatient?: Patient | null;
  onClearInitialPatient?: () => void;
}

export const QueueSubview: React.FC<QueueSubviewProps> = ({
  initialPatient,
  onClearInitialPatient
}) => {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAnnounced, setLastAnnounced] = useState<string | null>(null);

  // Walk-in Token modal state
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    patientId: '',
    doctorId: '',
    priority: 'NORMAL' as QueuePriority,
    notes: ''
  });

  // Transfer Token modal state
  const [transferTokenItem, setTransferTokenItem] = useState<QueueEntry | null>(null);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const data = await api.reception.getQueue({
        doctorId: selectedDoctorId || undefined
      });
      setQueue(data);
    } catch (err) {
      console.error('Failed to load queue', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const docs = await api.getDoctors();
      setDoctors(docs);
      const pts = await api.reception.getPatients();
      setPatients(pts);
      if (docs.length > 0 && !walkInForm.doctorId) {
        setWalkInForm(prev => ({ ...prev, doctorId: docs[0].id }));
      }
    } catch (err) {
      console.error('Failed to load doctors/patients', err);
    }
  };

  useEffect(() => {
    loadQueue();
    loadMetadata();
    // Auto refresh queue every 8 seconds
    const interval = setInterval(() => {
      loadQueue();
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  useEffect(() => {
    if (initialPatient) {
      setWalkInForm(prev => ({ ...prev, patientId: initialPatient.id }));
      setIsWalkInOpen(true);
    }
  }, [initialPatient]);

  const handleCall = async (item: QueueEntry) => {
    try {
      const res = await api.reception.callToken(item.id);
      announceToken(res.entry.tokenNumber, res.entry.chamberNumber, res.entry.patientName);
      setLastAnnounced(`Token #${res.entry.tokenNumber} -> Chamber ${res.entry.chamberNumber}`);
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to call token');
    }
  };

  const handleRecall = async (item: QueueEntry) => {
    try {
      const res = await api.reception.recallToken(item.id);
      announceToken(res.entry.tokenNumber, res.entry.chamberNumber, res.entry.patientName);
      setLastAnnounced(`Re-called: Token #${res.entry.tokenNumber} -> Chamber ${res.entry.chamberNumber}`);
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to re-call token');
    }
  };

  const handleConsult = async (id: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'IN_CONSULTATION' } : q));
    try {
      await api.reception.startConsultation(id);
      loadQueue();
    } catch (err: any) {
      console.error('Failed to update consultation', err);
    }
  };

  const handleComplete = async (id: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'COMPLETED' } : q));
    try {
      await api.reception.completeConsultation(id);
      loadQueue();
    } catch (err: any) {
      console.error('Failed to complete consultation', err);
    }
  };

  const handleSkip = async (id: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'SKIPPED' } : q));
    try {
      await api.reception.skipToken(id);
      loadQueue();
    } catch (err: any) {
      console.error('Failed to skip token', err);
    }
  };

  const handleHold = async (id: string) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'WAITING' } : q));
    try {
      await api.reception.holdToken(id);
      loadQueue();
    } catch (err: any) {
      console.error('Failed to hold token', err);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTokenItem || !targetDoctorId || !transferReason) {
      alert('Target doctor and reason are required');
      return;
    }
    try {
      await api.reception.transferToken(transferTokenItem.id, {
        targetDoctorId,
        reason: transferReason
      });
      setTransferTokenItem(null);
      setTransferReason('');
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    }
  };

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInForm.patientId || !walkInForm.doctorId) {
      alert('Patient and Doctor are required');
      return;
    }
    try {
      const entry = await api.reception.issueWalkInToken(walkInForm);
      setIsWalkInOpen(false);
      if (onClearInitialPatient) onClearInitialPatient();
      announceToken(entry.tokenNumber, entry.chamberNumber, entry.patientName);
      alert(`Token #${entry.tokenNumber} issued successfully for Chamber ${entry.chamberNumber}!`);
      loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to issue token');
    }
  };

  const waitingList = queue.filter(q => q.status === 'WAITING' || q.status === 'CALLED');
  const inConsultationList = queue.filter(q => q.status === 'IN_CONSULTATION');
  const completedCount = queue.filter(q => q.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Doctors & Chambers</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.fullName} (Chamber {d.chamberId ? 'Chamber' : '101'})</option>
              ))}
            </select>
          </div>

          {lastAnnounced && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-xs font-medium animate-pulse">
              <Volume2 className="w-3.5 h-3.5" />
              <span>{lastAnnounced}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsWalkInOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Issue Walk-In Token
        </button>
      </div>

      {/* Real-time Status Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-500/10 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Waiting in Lobby</span>
            <span className="text-2xl font-bold text-amber-900">{waitingList.length}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
            {waitingList.length}
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block">In Consultation</span>
            <span className="text-2xl font-bold text-blue-900">{inConsultationList.length}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {inConsultationList.length}
          </div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Completed Today</span>
            <span className="text-2xl font-bold text-emerald-900">{completedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
            {completedCount}
          </div>
        </div>
      </div>

      {/* Main Queue Action Cards */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Live Lobby Queue Board</h3>
          </div>
          <span className="text-xs text-slate-400">Audio Voice Enabled (Web Speech)</span>
        </div>

        {isLoading && queue.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading queue tokens...</div>
        ) : queue.length === 0 ? (
          <div className="py-12 text-center">
            <Tv className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-xs">Queue is currently empty</p>
            <p className="text-slate-400 text-xs mt-0.5">Click &quot;Issue Walk-In Token&quot; or check in scheduled appointments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Token #</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Doctor & Chamber</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Voice & Queue Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition ${
                      item.status === 'CALLED' ? 'bg-amber-50/40' : item.status === 'IN_CONSULTATION' ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          #{item.tokenNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{item.visitType}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{item.patientName}</div>
                      <div className="text-slate-500 text-[11px]">{item.patientAge} yrs • {item.patientPhone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{item.doctorName}</div>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        Chamber {item.chamberNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                          item.priority === 'EMERGENCY'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : item.priority === 'URGENT'
                            ? 'bg-orange-100 text-orange-800 border border-orange-200'
                            : item.priority === 'VIP'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                          item.status === 'CALLED'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : item.status === 'IN_CONSULTATION'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'SKIPPED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.calledCount > 0 && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">Called {item.calledCount}x</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {item.status === 'WAITING' && (
                          <button
                            onClick={() => handleCall(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md shadow-2xs text-[11px] transition"
                          >
                            <Volume2 className="w-3 h-3" /> Call
                          </button>
                        )}

                        {item.status === 'CALLED' && (
                          <>
                            <button
                              onClick={() => handleRecall(item)}
                              title="Re-announce token"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md text-[11px]"
                            >
                              <RotateCcw className="w-3 h-3" /> Re-call
                            </button>
                            <button
                              onClick={() => handleConsult(item.id)}
                              title="Patient entering chamber"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-[11px]"
                            >
                              <Play className="w-3 h-3" /> Enter
                            </button>
                          </>
                        )}

                        {item.status === 'IN_CONSULTATION' && (
                          <button
                            onClick={() => handleComplete(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-[11px]"
                          >
                            <CheckCircle className="w-3 h-3" /> Done
                          </button>
                        )}

                        {(item.status === 'WAITING' || item.status === 'CALLED') && (
                          <>
                            <button
                              onClick={() => handleSkip(item.id)}
                              title="Skip token"
                              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                              <SkipForward className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setTransferTokenItem(item);
                                if (doctors.length > 0) setTargetDoctorId(doctors[0].id);
                              }}
                              title="Transfer to another doctor"
                              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Walk-in Token Modal */}
      {isWalkInOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Issue Walk-In Queue Token</h3>
              <button
                onClick={() => {
                  setIsWalkInOpen(false);
                  if (onClearInitialPatient) onClearInitialPatient();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalkInSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  required
                  value={walkInForm.patientId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.patientId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Doctor & Chamber *</label>
                <select
                  required
                  value={walkInForm.doctorId}
                  onChange={(e) => setWalkInForm({ ...walkInForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Priority Classification</label>
                <select
                  value={walkInForm.priority}
                  onChange={(e) => setWalkInForm({ ...walkInForm, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="NORMAL">Normal Walk-in</option>
                  <option value="URGENT">Urgent (Severe symptoms)</option>
                  <option value="EMERGENCY">Emergency (Immediate attention)</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Symptoms</label>
                <input
                  type="text"
                  value={walkInForm.notes}
                  onChange={(e) => setWalkInForm({ ...walkInForm, notes: e.target.value })}
                  placeholder="e.g. Acute abdominal pain"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWalkInOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Generate & Announce Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Token Modal */}
      {transferTokenItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Transfer Token #{transferTokenItem.tokenNumber}</h3>
              <button
                onClick={() => setTransferTokenItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 pt-4 text-xs">
              <p className="text-slate-600">
                Transferring patient <strong>{transferTokenItem.patientName}</strong> to another consultant chamber.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Doctor *</label>
                <select
                  required
                  value={targetDoctorId}
                  onChange={(e) => setTargetDoctorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">-- Choose New Doctor --</option>
                  {doctors.filter(d => d.id !== transferTokenItem.doctorId).map(d => (
                    <option key={d.id} value={d.id}>{d.fullName} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Transfer *</label>
                <textarea
                  required
                  rows={2}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Doctor called into surgery / specialized cardiology opinion needed"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferTokenItem(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
