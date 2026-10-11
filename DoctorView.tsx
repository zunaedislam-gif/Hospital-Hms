/**
 * Pattern HMS - Doctor Clinical Workstation
 * Fully Multilingual (English / বাংলা) with Live SSE Realtime Integration
 * Features: Chamber Queue, Calling Next Patient, Recall, Skip with Reason,
 * Dedicated Prayer/Regular Break Management with Return Estimates,
 * Consultation Clinical Documentation, Vitals, Diagnoses, E-Prescription,
 * and In-Chamber Diagnostic Test Ordering.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Stethoscope,
  Users,
  Play,
  Volume2,
  Clock,
  Coffee,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  Plus,
  Trash2,
  FileText,
  FlaskConical,
  HeartPulse,
  Activity,
  UserCheck,
  Calendar,
  Sparkles,
  Phone,
  Search,
  Check,
  RefreshCw,
  Eye,
  Printer,
  ChevronRight,
  SunMedium,
  ShieldAlert,
  Save,
  Moon
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRealtime } from '../../context/RealtimeContext';
import { speakTokenAnnouncement } from '../reception/utils/speech';
import {
  QueueEntry,
  Consultation,
  Prescription,
  TestOrder,
  DoctorAvailabilityState
} from '../../types';

export const DoctorView: React.FC = () => {
  const { user } = useAuth();
  const { tObj, isBangla, language } = useLanguage();
  const { subscribe, isConnected } = useRealtime();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [availability, setAvailability] = useState<DoctorAvailabilityState | null>(null);
  const [queue, setQueue] = useState<{
    currentServing: QueueEntry | null;
    waiting: QueueEntry[];
    completed: QueueEntry[];
    skipped: QueueEntry[];
  }>({
    currentServing: null,
    waiting: [],
    completed: [],
    skipped: []
  });

  const [activeTab, setActiveTab] = useState<'consultation' | 'queue' | 'history'>('consultation');
  const [queueSubTab, setQueueSubTab] = useState<'waiting' | 'completed' | 'skipped'>('waiting');

  // Active Consultation State
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [consultationPatient, setConsultationPatient] = useState<any>(null);
  const [previousConsultations, setPreviousConsultations] = useState<Consultation[]>([]);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);

  // Modals
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [breakType, setBreakType] = useState<'PRAYER_BREAK' | 'REGULAR_BREAK' | 'EMERGENCY'>('PRAYER_BREAK');
  const [breakExpectedTime, setBreakExpectedTime] = useState('14:30');
  const [breakNotes, setBreakNotes] = useState('');

  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipTargetEntry, setSkipTargetEntry] = useState<QueueEntry | null>(null);
  const [skipReason, setSkipReason] = useState('Patient not present when called');
  const [skipNotes, setSkipNotes] = useState('');

  const [showLabOrderModal, setShowLabOrderModal] = useState(false);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [testPriority, setTestPriority] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('NORMAL');
  const [testClinicalIndication, setTestClinicalIndication] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Clinical Documentation Form State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [examination, setExamination] = useState('');
  const [vitals, setVitals] = useState({
    bpSystolic: 120,
    bpDiastolic: 80,
    pulse: 74,
    temperature: 98.6,
    respiratoryRate: 16,
    spo2: 99,
    weight: 68,
    height: 170
  });
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState<string[]>([]);
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);

  // E-Prescription Medicines Form State
  const [medicines, setMedicines] = useState<Array<{
    id: string;
    medicine: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: string;
    instructions: string;
    quantity: string;
  }>>([
    {
      id: 'med_1',
      medicine: 'Tab. Paracetamol 500mg',
      dosage: '1 tablet',
      frequency: '1+1+1',
      duration: '3 days',
      route: 'Oral',
      instructions: 'After meal if fever or body pain',
      quantity: '10'
    }
  ]);
  const [rxAdvice, setRxAdvice] = useState('Drink plenty of warm water, adequate rest, and monitor body temperature.');

  // Notification helper
  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Initial Data
  const loadDoctorData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashRes, queueRes, testsRes] = await Promise.all([
        api.doctor.getDashboard(),
        api.doctor.getQueue(),
        api.getDiagnosticTests()
      ]);

      if (dashRes) {
        const d = (dashRes as any).data || dashRes;
        setDoctorProfile(d.doctor);
        setAvailability(d.availability);
      }

      if (queueRes) {
        const q = (queueRes as any).data || queueRes;
        setQueue({
          currentServing: q.currentServing,
          waiting: q.waiting || [],
          completed: q.completed || [],
          skipped: q.skipped || []
        });

        // If a patient is currently in consultation or called, load their consultation record
        if (q.currentServing) {
          loadConsultationForEntry(q.currentServing.id);
        }
      }

      if (testsRes) {
        setAvailableTests(testsRes);
      }
    } catch (err: any) {
      console.error('Failed to load doctor clinical dashboard', err);
      notify('error', 'Failed to load doctor clinical dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConsultationForEntry = async (queueId: string) => {
    try {
      const res = await api.doctor.getConsultation(queueId);
      const resData = (res as any)?.data || res;
      if (resData && resData.consultation) {
        const c = resData.consultation;
        setCurrentConsultation(c);
        setConsultationPatient(resData.patient || { name: c.patientName, age: c.patientAge, gender: c.patientGender, phone: c.patientPhone });
        setPreviousConsultations(resData.previousConsultations || []);
        setActivePrescription(resData.prescription || null);

        // Populate clinical fields
        setChiefComplaint(c.chiefComplaint || '');
        setHistoryOfPresentIllness(c.historyOfPresentIllness || '');
        setExamination(c.examination || '');
        if (c.vitals) {
          setVitals({
            bpSystolic: c.vitals.bpSystolic || 120,
            bpDiastolic: c.vitals.bpDiastolic || 80,
            pulse: c.vitals.pulse || 74,
            temperature: c.vitals.temperature || 98.6,
            respiratoryRate: c.vitals.respiratoryRate || 16,
            spo2: c.vitals.spo2 || 99,
            weight: c.vitals.weight || 68,
            height: c.vitals.height || 170
          });
        }
        setPrimaryDiagnosis(c.diagnosis?.primary || '');
        setSecondaryDiagnoses(c.diagnosis?.secondary || []);
        setTreatmentPlan(c.treatmentPlan || '');
        setFollowUpRequired(c.followUpRequired || false);
        setFollowUpDate(c.followUpDate || '');

        if (resData.prescription?.medicines?.length) {
          setMedicines(resData.prescription.medicines);
          setRxAdvice(resData.prescription.advice || '');
        }
      }
    } catch (err) {
      console.warn('No active consultation record found for entry, will initialize on start');
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [loadDoctorData]);

  // Subscribe to Real-time SSE Events
  useEffect(() => {
    const unsubQueue = subscribe('QUEUE_UPDATED', () => loadDoctorData());
    const unsubCalled = subscribe('QUEUE_PATIENT_CALLED', () => loadDoctorData());
    const unsubStatus = subscribe('DOCTOR_STATUS_CHANGED', (data: any) => {
      setAvailability(prev => prev ? { ...prev, ...data } : data);
    });

    return () => {
      unsubQueue();
      unsubCalled();
      unsubStatus();
    };
  }, [subscribe, loadDoctorData]);

  // Handler: Call Next Patient Atomically
  const handleCallNext = async () => {
    try {
      setActionLoading(true);
      const res = await api.doctor.callNext();
      const resData = (res as any)?.data || res;
      if (resData && resData.calledEntry) {
        notify('success', `Called token ${resData.calledEntry.tokenNumber}`);
        // Play acoustic voice announcement
        const chamberNum = resData.calledEntry.chamberNumber || doctorProfile?.chamberNumber || '101';
        speakTokenAnnouncement(resData.calledEntry.tokenNumber, chamberNum, language);

        await loadDoctorData();
        setActiveTab('consultation');
      }
    } catch (err: any) {
      notify('error', err.message || 'No waiting patients in queue');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Re-announce Current Token
  const handleRecall = async () => {
    if (!queue.currentServing) return;
    try {
      setActionLoading(true);
      const res = await api.doctor.recall(queue.currentServing.id);
      const resData = (res as any)?.data || res;
      if (resData) {
        const chamberNum = queue.currentServing.chamberNumber || doctorProfile?.chamberNumber || '101';
        speakTokenAnnouncement(queue.currentServing.tokenNumber, chamberNum, language);
        notify('success', `Recall broadcasted for Token ${queue.currentServing.tokenNumber}`);
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to recall patient');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Start Consultation
  const handleStartConsultation = async () => {
    if (!queue.currentServing) return;
    try {
      setActionLoading(true);
      const res = await api.doctor.startConsult(queue.currentServing.id);
      const resData = (res as any)?.data || res;
      if (resData && resData.entry) {
        notify('success', `Consultation started with ${resData.entry.patientName}`);
        await loadConsultationForEntry(queue.currentServing.id);
        await loadDoctorData();
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to start consultation');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Skip Token
  const handleConfirmSkip = async () => {
    if (!skipTargetEntry) return;
    try {
      setActionLoading(true);
      await api.doctor.skip(skipTargetEntry.id, { reason: skipReason, notes: skipNotes });
      notify('success', `Token ${skipTargetEntry.tokenNumber} marked as skipped`);
      setShowSkipModal(false);
      setSkipTargetEntry(null);
      await loadDoctorData();
    } catch (err: any) {
      notify('error', err.message || 'Failed to skip patient');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Break & Prayer Break Management
  const handleStartBreak = async () => {
    try {
      setActionLoading(true);
      const res = await api.doctor.startBreak({
        breakType,
        expectedReturnTime: breakExpectedTime,
        notes: breakNotes
      });
      const resData = (res as any)?.data || res;
      if (resData) {
        setAvailability(resData);
        setShowBreakModal(false);
        notify('success', `Break registered: ${breakType === 'PRAYER_BREAK' ? 'Prayer Break' : 'Chamber Break'}. Queue preserved.`);
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to register break');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeBreak = async () => {
    try {
      setActionLoading(true);
      const res = await api.doctor.resumeBreak();
      const resData = (res as any)?.data || res;
      if (resData) {
        setAvailability(resData);
        notify('success', 'Status resumed to AVAILABLE. Ready for patients.');
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to resume availability');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Save Clinical Documentation
  const handleSaveClinicalNotes = async () => {
    if (!currentConsultation) {
      notify('error', 'No active consultation session');
      return;
    }
    try {
      setActionLoading(true);
      await api.doctor.updateConsultation(currentConsultation.id, {
        chiefComplaint,
        historyOfPresentIllness,
        examination,
        vitals,
        diagnosis: {
          primary: primaryDiagnosis,
          secondary: secondaryDiagnoses
        },
        treatmentPlan,
        followUpRequired,
        followUpDate
      });
      notify('success', 'Clinical documentation saved successfully');
    } catch (err: any) {
      notify('error', err.message || 'Failed to save clinical notes');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Generate Prescription
  const handleSavePrescription = async () => {
    if (!currentConsultation) {
      notify('error', 'No active consultation session');
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.doctor.createPrescription(currentConsultation.id, {
        medicines,
        clinicalNotes: chiefComplaint,
        advice: rxAdvice,
        followUpDate: followUpDate || undefined
      });
      const rxData = (res as any)?.data || res;
      if (rxData) {
        setActivePrescription(rxData);
        notify('success', `Prescription #${rxData.prescriptionNumber} generated successfully`);
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to save prescription');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Order Lab Tests
  const handleConfirmLabOrder = async () => {
    if (!currentConsultation) return;
    if (selectedTestIds.length === 0) {
      notify('error', 'Select at least one diagnostic test');
      return;
    }
    try {
      setActionLoading(true);
      const res = await api.doctor.orderTests(currentConsultation.id, {
        testIds: selectedTestIds,
        priority: testPriority,
        clinicalIndication: testClinicalIndication || primaryDiagnosis
      });
      const orderData = (res as any)?.data || res;
      if (orderData) {
        notify('success', `Order #${orderData.orderNumber} dispatched to Pathology laboratory`);
        setShowLabOrderModal(false);
        setSelectedTestIds([]);
        testClinicalIndication && setTestClinicalIndication('');
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to submit lab order');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Complete Consultation
  const handleCompleteConsultation = async () => {
    if (!currentConsultation) return;
    try {
      setActionLoading(true);
      // Ensure notes & rx are saved first
      await handleSaveClinicalNotes();
      if (medicines.length > 0) {
        await handleSavePrescription();
      }

      await api.doctor.completeConsultation(currentConsultation.id);
      notify('success', 'Consultation finalized! Patient record saved and chamber cleared.');
      setCurrentConsultation(null);
      setConsultationPatient(null);
      await loadDoctorData();
    } catch (err: any) {
      notify('error', err.message || 'Failed to complete consultation');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper for adding/removing medicines
  const handleAddMedicine = () => {
    setMedicines(prev => [
      ...prev,
      {
        id: 'med_' + (prev.length + 1),
        medicine: '',
        dosage: '1 tab',
        frequency: '1+0+1',
        duration: '5 days',
        route: 'Oral',
        instructions: 'After food',
        quantity: '10'
      }
    ]);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index: number, field: string, value: string) => {
    setMedicines(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const isDoctorOnBreak = availability?.status === 'ON_BREAK' || availability?.status === 'ON_PRAYER_BREAK';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-semibold animate-in fade-in slide-in-from-bottom-5 ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Clinical Header & Doctor Status Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shadow-2xs">
            <Stethoscope className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">
                {doctorProfile?.fullName || 'Dr. Tariq Rahman, MD'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100/70 text-teal-800 border border-teal-200">
                Chamber {doctorProfile?.chamberNumber || '101'}
              </span>
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {doctorProfile?.specialtyName || 'Senior Consultant Cardiologist'} • Reg: {doctorProfile?.medicalRegNumber || 'BMDC-49201'}
            </p>
          </div>
        </div>

        {/* Availability & Prayer Break Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Indicator */}
          {isDoctorOnBreak ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <Moon className="w-4 h-4 text-amber-600" />
              <div className="text-xs">
                <span className="font-bold text-amber-900">
                  {availability?.status === 'ON_PRAYER_BREAK' ? 'On Prayer Break' : 'On Break'}
                </span>
                {availability?.expectedReturnTime && (
                  <span className="text-amber-700 ml-1.5">
                    (Returns: {availability.expectedReturnTime})
                  </span>
                )}
              </div>
              <button
                onClick={handleResumeBreak}
                disabled={actionLoading}
                className="ml-2 text-xs font-semibold px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-2xs transition cursor-pointer"
              >
                Resume Duty
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-800">Available in Chamber</span>
              <button
                onClick={() => setShowBreakModal(true)}
                className="ml-2 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg shadow-2xs transition cursor-pointer"
              >
                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                Take Break
              </button>
            </div>
          )}

          {/* Quick Refresh */}
          <button
            onClick={loadDoctorData}
            title="Refresh Chamber Data"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary Dispatch Bar: Current Patient & Call Next Controls */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-teal-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Currently Called / In-Consultation Patient */}
          <div className="flex-1">
            <div className="text-[11px] font-bold tracking-wider uppercase text-teal-300 mb-1 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Active Chamber Patient
            </div>
            {queue.currentServing ? (
              <div className="flex items-center gap-4">
                <div className="px-3.5 py-1.5 bg-teal-500/20 border border-teal-400/40 rounded-xl text-center">
                  <div className="text-[10px] text-teal-200 font-semibold">TOKEN</div>
                  <div className="text-2xl font-black text-white">{queue.currentServing.tokenNumber}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{queue.currentServing.patientName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        queue.currentServing.status === 'IN_CONSULTATION'
                          ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                          : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                      }`}
                    >
                      {queue.currentServing.status === 'IN_CONSULTATION' ? 'In Consultation' : 'Called (Waiting Entry)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Phone: {queue.currentServing.patientPhone || 'N/A'} • Chamber {queue.currentServing.chamberNumber || '101'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-300 italic">
                Chamber is currently idle. Click <strong className="text-teal-300">Call Next Patient</strong> to invite the next waiting patient.
              </div>
            )}
          </div>

          {/* Action Dispatch Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {queue.currentServing && queue.currentServing.status === 'CALLED' && (
              <button
                onClick={handleStartConsultation}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Consultation
              </button>
            )}

            {queue.currentServing && (
              <>
                <button
                  onClick={handleRecall}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition cursor-pointer"
                  title="Re-announce token acoustic chime"
                >
                  <Volume2 className="w-4 h-4 text-teal-400" />
                  Recall Audio
                </button>
                <button
                  onClick={() => {
                    setSkipTargetEntry(queue.currentServing);
                    setShowSkipModal(true);
                  }}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-300 hover:text-rose-200 text-xs font-semibold transition cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>
              </>
            )}

            {/* Prominent Call Next Button */}
            <button
              onClick={handleCallNext}
              disabled={actionLoading || queue.waiting.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg cursor-pointer ${
                queue.waiting.length > 0
                  ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 ring-2 ring-teal-300/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Call Next Patient ({queue.waiting.length} Waiting)
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('consultation')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'consultation'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Clinical Consultation & Prescription
            {currentConsultation && (
              <span className="w-2 h-2 rounded-full bg-teal-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Chamber Queue
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
              {queue.waiting.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Patient Timeline & Lab Results
          </button>
        </div>

        {activeTab === 'consultation' && currentConsultation && (
          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={() => setShowLabOrderModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Order Lab Tests
            </button>
            <button
              onClick={handleSaveClinicalNotes}
              disabled={actionLoading}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Save Notes
            </button>
            <button
              onClick={handleCompleteConsultation}
              disabled={actionLoading}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Complete & Release
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: Clinical Consultation Workspace */}
      {activeTab === 'consultation' && (
        <div className="space-y-6">
          {!currentConsultation ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mx-auto mb-4">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No Patient in Active Consultation</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                To start a consultation, either call the next patient from your chamber queue or click &quot;Start Consultation&quot; on the currently called token.
              </p>
              <button
                onClick={handleCallNext}
                disabled={actionLoading || queue.waiting.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                Call Next Patient ({queue.waiting.length} Waiting)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Columns: Clinical Documentation & E-Prescription */}
              <div className="lg:col-span-2 space-y-6">
                {/* Patient Demographics & Baseline Vitals */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                        {currentConsultation.patientName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{currentConsultation.patientName}</h3>
                        <p className="text-xs text-slate-500">
                          {currentConsultation.patientAge} Yrs • {currentConsultation.patientGender} • Phone: {currentConsultation.patientPhone || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                      {currentConsultation.consultationNumber}
                    </span>
                  </div>

                  {/* Vitals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Blood Pressure</span>
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="number"
                          value={vitals.bpSystolic}
                          onChange={e => setVitals({ ...vitals, bpSystolic: Number(e.target.value) })}
                          className="w-12 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center"
                        />
                        <span className="text-xs text-slate-400">/</span>
                        <input
                          type="number"
                          value={vitals.bpDiastolic}
                          onChange={e => setVitals({ ...vitals, bpDiastolic: Number(e.target.value) })}
                          className="w-12 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center"
                        />
                        <span className="text-[10px] text-slate-500">mmHg</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Pulse Rate</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          value={vitals.pulse}
                          onChange={e => setVitals({ ...vitals, pulse: Number(e.target.value) })}
                          className="w-14 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center"
                        />
                        <span className="text-[10px] text-slate-500">bpm</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Temperature</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          step="0.1"
                          value={vitals.temperature}
                          onChange={e => setVitals({ ...vitals, temperature: Number(e.target.value) })}
                          className="w-14 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center"
                        />
                        <span className="text-[10px] text-slate-500">°F</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">SpO2 Oxygen</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          value={vitals.spo2}
                          onChange={e => setVitals({ ...vitals, spo2: Number(e.target.value) })}
                          className="w-14 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-center"
                        />
                        <span className="text-[10px] text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chief Complaint & Examination */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800">
                        Chief Complaint & Symptom History
                      </label>
                      <div className="flex items-center gap-1">
                        {['Chest pain', 'Fever & chills', 'Shortness of breath', 'Headache', 'Dizziness'].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setChiefComplaint(prev => prev ? `${prev}, ${s}` : s)}
                            className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded-full border border-slate-200 transition cursor-pointer"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={chiefComplaint}
                      onChange={e => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Exertional chest tightness for 3 days, radiating to left shoulder..."
                      className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Physical Examination & Clinical Findings
                    </label>
                    <textarea
                      rows={2}
                      value={examination}
                      onChange={e => setExamination(e.target.value)}
                      placeholder="e.g. S1 S2 heard, no added murmurs. Chest clear bilaterally. No peripheral edema..."
                      className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                    />
                  </div>

                  {/* Diagnosis */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Primary Clinical Diagnosis
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={primaryDiagnosis}
                        onChange={e => setPrimaryDiagnosis(e.target.value)}
                        placeholder="e.g. Essential Hypertension (Grade 1), Angina Pectoris"
                        className="flex-1 text-xs text-slate-800 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                      />
                      <div className="flex items-center gap-1">
                        {['Hypertension', 'T2DM', 'Bronchitis', 'Gastritis'].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setPrimaryDiagnosis(d)}
                            className="text-[10px] font-semibold px-2.5 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* E-Prescription Medication Management */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        Electronic Prescription (Rx)
                      </h3>
                      <p className="text-xs text-slate-500">Medicines, dosage frequency, and duration</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddMedicine}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Medicine
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePrescription}
                        disabled={actionLoading}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                      >
                        Save Rx
                      </button>
                    </div>
                  </div>

                  {/* Medicines List */}
                  <div className="space-y-3">
                    {medicines.map((med, index) => (
                      <div
                        key={med.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              value={med.medicine}
                              onChange={e => handleUpdateMedicine(index, 'medicine', e.target.value)}
                              placeholder="Medicine name (e.g. Tab. Amlodipine 5mg)"
                              className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={e => handleUpdateMedicine(index, 'dosage', e.target.value)}
                              placeholder="Dosage"
                              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={e => handleUpdateMedicine(index, 'frequency', e.target.value)}
                              placeholder="1+0+1"
                              className="w-full text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center"
                            />
                          </div>
                          <div className="sm:col-span-2 flex items-center gap-1.5">
                            <input
                              type="text"
                              value={med.duration}
                              onChange={e => handleUpdateMedicine(index, 'duration', e.target.value)}
                              placeholder="7 days"
                              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                            />
                            {medicines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMedicine(index)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">Instructions:</span>
                          <input
                            type="text"
                            value={med.instructions}
                            onChange={e => handleUpdateMedicine(index, 'instructions', e.target.value)}
                            placeholder="e.g. After meal with plenty of water"
                            className="flex-1 text-[11px] text-slate-700 bg-white border border-slate-200 rounded px-2 py-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* General Advice & Follow-up */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Doctor Advice & Dietary Guidelines
                      </label>
                      <textarea
                        rows={2}
                        value={rxAdvice}
                        onChange={e => setRxAdvice(e.target.value)}
                        placeholder="Diet restrictions, lifestyle recommendations, emergency signs..."
                        className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:border-teal-500"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={followUpRequired}
                          onChange={e => setFollowUpRequired(e.target.checked)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        Follow-up visit required
                      </label>
                      {followUpRequired && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Return Date:</span>
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={e => setFollowUpDate(e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: In-Chamber Lab Ordering & Investigation Status */}
              <div className="space-y-6">
                {/* Lab Investigation Orders Panel */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-teal-600" />
                      Laboratory Orders
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowLabOrderModal(true)}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Order
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">
                    Order diagnostic tests in real-time. Pathology technicians receive requests immediately.
                  </p>

                  <div className="space-y-2">
                    {/* Quick Tests to Order */}
                    <div className="text-[11px] font-semibold text-slate-600 mb-1">Quick Clinical Panels:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {['CBC', 'Fasting Blood Glucose', 'Lipid Profile', 'KFT', 'LFT', 'HbA1c'].map(testName => (
                        <button
                          key={testName}
                          type="button"
                          onClick={() => {
                            const match = availableTests.find(t => t.name.includes(testName) || t.code?.includes(testName));
                            if (match && !selectedTestIds.includes(match.id)) {
                              setSelectedTestIds([...selectedTestIds, match.id]);
                              setShowLabOrderModal(true);
                            }
                          }}
                          className="text-[10px] font-medium px-2 py-1 bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-800 rounded-lg transition cursor-pointer"
                        >
                          + {testName}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Patient Summary Card */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Medical History Highlights
                  </h3>
                  <div className="text-xs text-slate-600 space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Known Allergies:</span>
                      <span className="font-semibold text-slate-800">Penicillin (Mild Rash)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Chronic Illnesses:</span>
                      <span className="font-semibold text-slate-800">Hypertension (2 Yrs)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Previous Visits:</span>
                      <span className="font-semibold text-teal-700">{previousConsultations.length} Consultations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Chamber Queue Management */}
      {activeTab === 'queue' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQueueSubTab('waiting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  queueSubTab === 'waiting'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Waiting Patients ({queue.waiting.length})
              </button>
              <button
                onClick={() => setQueueSubTab('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  queueSubTab === 'completed'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Completed Today ({queue.completed.length})
              </button>
              <button
                onClick={() => setQueueSubTab('skipped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  queueSubTab === 'skipped'
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Skipped ({queue.skipped.length})
              </button>
            </div>

            <button
              onClick={handleCallNext}
              disabled={actionLoading || queue.waiting.length === 0}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Call Next Waiting
            </button>
          </div>

          {/* Subtab List */}
          {queueSubTab === 'waiting' && (
            <div className="divide-y divide-slate-100">
              {queue.waiting.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No patients waiting in queue for Chamber {doctorProfile?.chamberNumber || '101'}.
                </div>
              ) : (
                queue.waiting.map((q, idx) => (
                  <div
                    key={q.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <div className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 font-bold rounded-lg text-xs">
                        {q.tokenNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{q.patientName}</span>
                          {q.isEmergency && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                              EMERGENCY
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Waiting ~{q.timeWaitingMinutes || 5} mins • Phone: {q.patientPhone || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          // Quick call this specific entry
                          setSkipTargetEntry(q);
                          setShowSkipModal(true);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {queueSubTab === 'completed' && (
            <div className="divide-y divide-slate-100">
              {queue.completed.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No completed consultations today.</div>
              ) : (
                queue.completed.map(q => (
                  <div key={q.id} className="py-2.5 flex items-center justify-between text-xs px-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-teal-700">{q.tokenNumber}</span>
                      <span className="font-medium text-slate-800">{q.patientName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Completed at {q.completedAt ? new Date(q.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {queueSubTab === 'skipped' && (
            <div className="divide-y divide-slate-100">
              {queue.skipped.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">No skipped patients today.</div>
              ) : (
                queue.skipped.map(q => (
                  <div key={q.id} className="py-2.5 flex items-center justify-between text-xs px-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-rose-700">{q.tokenNumber}</span>
                      <span className="font-medium text-slate-800">{q.patientName}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Skipped: {q.skipReason || 'Patient not present'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: History & Lab Results Timeline */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Patient Historical Consultations & Diagnostic Reports</h3>
          {previousConsultations.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No historical records for this patient yet. Records are saved upon consultation completion.
            </p>
          ) : (
            <div className="space-y-3">
              {previousConsultations.map(c => (
                <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-800">{c.consultationNumber}</span>
                    <span className="text-xs text-slate-500">{new Date(c.startedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <strong>Diagnosis:</strong> {c.diagnosis.primary || 'General Examination'}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Treatment Plan:</strong> {c.treatmentPlan || 'Medications prescribed as per Rx'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Doctor Break / Prayer Break Setup */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-600" />
                Register Chamber Break
              </h3>
              <button
                onClick={() => setShowBreakModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              When a break is registered, your chamber queue remains intact, and the waiting room display displays your expected return time to keep patients informed.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Break Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBreakType('PRAYER_BREAK')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      breakType === 'PRAYER_BREAK'
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-amber-600" />
                    Prayer Break
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakType('REGULAR_BREAK')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                      breakType === 'REGULAR_BREAK'
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Coffee className="w-4 h-4 text-amber-600" />
                    Tea / Lunch Break
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Expected Return Time
                </label>
                <input
                  type="time"
                  value={breakExpectedTime}
                  onChange={e => setBreakExpectedTime(e.target.value)}
                  className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded-xl p-2.5 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notice to Waiting Patients (Optional)
                </label>
                <input
                  type="text"
                  value={breakNotes}
                  onChange={e => setBreakNotes(e.target.value)}
                  placeholder="e.g. Back in 20 minutes after Zuhr prayer"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBreakModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartBreak}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md transition cursor-pointer"
              >
                Confirm Break
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Skip Patient with Mandatory Reason */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SkipForward className="w-5 h-5 text-rose-600" />
                Skip Patient Token #{skipTargetEntry?.tokenNumber}
              </h3>
              <button
                onClick={() => setShowSkipModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason for Skipping (Mandatory)
                </label>
                <select
                  value={skipReason}
                  onChange={e => setSkipReason(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800"
                >
                  <option value="Patient not present when called">Patient not present when called</option>
                  <option value="Patient requested delay / stepped out">Patient requested delay / stepped out</option>
                  <option value="Emergency case prioritised">Emergency case prioritised</option>
                  <option value="Wrong chamber assigned">Wrong chamber assigned</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Notes
                </label>
                <input
                  type="text"
                  value={skipNotes}
                  onChange={e => setSkipNotes(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSkipModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSkip}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md transition cursor-pointer"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: In-Chamber Diagnostic Test Ordering */}
      {showLabOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-indigo-600" />
                  Order Diagnostic Lab Investigations
                </h3>
                <p className="text-xs text-slate-500">Patient: {currentConsultation?.patientName}</p>
              </div>
              <button
                onClick={() => setShowLabOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Test Selection Grid */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Diagnostic Tests ({selectedTestIds.length} Selected)
                </label>
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 p-2 space-y-1">
                  {availableTests.map(test => {
                    const isSelected = selectedTestIds.includes(test.id);
                    return (
                      <div
                        key={test.id}
                        onClick={() => {
                          if (isSelected) setSelectedTestIds(selectedTestIds.filter(id => id !== test.id));
                          else setSelectedTestIds([...selectedTestIds, test.id]);
                        }}
                        className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/80 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-indigo-600"
                          />
                          <span>{test.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({test.code})</span>
                        </div>
                        <span className="text-xs font-semibold text-slate-600">
                          {test.basePrice} BDT
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                  <select
                    value={testPriority}
                    onChange={e => setTestPriority(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white"
                  >
                    <option value="NORMAL">Normal Routine</option>
                    <option value="URGENT">Urgent (STAT)</option>
                    <option value="EMERGENCY">Critical Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Indication</label>
                  <input
                    type="text"
                    value={testClinicalIndication}
                    onChange={e => setTestClinicalIndication(e.target.value)}
                    placeholder="e.g. Suspected Dengue / DM evaluation"
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLabOrderModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLabOrder}
                disabled={actionLoading || selectedTestIds.length === 0}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer"
              >
                Dispatch to Lab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
