/**
 * Pattern HMS - Front-Desk & Receptionist Master Portal
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Tv,
  Receipt,
  Percent,
  FlaskConical,
  Clock,
  HeartPulse,
  DollarSign,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { ReceptionistKPIs, Patient } from '../../types';
import { PatientsSubview } from './subviews/PatientsSubview';
import { AppointmentsSubview } from './subviews/AppointmentsSubview';
import { QueueSubview } from './subviews/QueueSubview';
import { BillingSubview } from './subviews/BillingSubview';
import { SalesAgentsSubview } from './subviews/SalesAgentsSubview';
import { TestOrdersSubview } from './subviews/TestOrdersSubview';
import { ShiftsSubview } from './subviews/ShiftsSubview';

type SubTab =
  | 'patients'
  | 'appointments'
  | 'queue'
  | 'billing'
  | 'agents'
  | 'tests'
  | 'shifts';

export const ReceptionView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('patients');
  const [kpis, setKpis] = useState<ReceptionistKPIs | null>(null);
  const [initialPatient, setInitialPatient] = useState<Patient | null>(null);

  const loadKPIs = async () => {
    try {
      const data = await api.reception.getKPIs();
      setKpis(data);
    } catch (err) {
      console.error('Failed to load receptionist KPIs', err);
    }
  };

  useEffect(() => {
    loadKPIs();
    const interval = setInterval(loadKPIs, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleIssueTokenForPatient = (patient: Patient) => {
    setInitialPatient(patient);
    setActiveSubTab('queue');
  };

  const handleBookAppointmentForPatient = (patient: Patient) => {
    setInitialPatient(patient);
    setActiveSubTab('appointments');
  };

  const handleCreateInvoiceForPatient = (patient: Patient) => {
    setInitialPatient(patient);
    setActiveSubTab('billing');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-2xl border border-teal-900/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <HeartPulse className="w-6 h-6 stroke-[2.3]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Front-Desk & Receptionist Workspace
                <span className="text-[11px] font-semibold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
                  Live Operations
                </span>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Patient Registration, Queue Token Management, Sales Agent Ledgers & Point of Sale Billing
              </p>
            </div>
          </div>
        </div>

        {/* Real-time KPI Stats Bar */}
        {kpis && (
          <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 relative z-10">
            <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Today&apos;s Patients</span>
              <span className="text-lg font-bold text-white">{kpis.todayPatients}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Appointments</span>
              <span className="text-lg font-bold text-teal-400">{kpis.todayAppointments}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider block">Waiting in Lobby</span>
              <span className="text-lg font-bold text-amber-400">{kpis.waitingPatients}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-blue-300 uppercase tracking-wider block">In Consultation</span>
              <span className="text-lg font-bold text-blue-400">{kpis.patientsInConsultation}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Today&apos;s Revenue</span>
              <span className="text-lg font-bold text-emerald-400">৳{kpis.todayRevenue}</span>
            </div>
            <div className="bg-white/5 backdrop-blur-xs p-2.5 rounded-lg border border-white/10">
              <span className="text-[10px] text-purple-300 uppercase tracking-wider block">Pending Lab Tests</span>
              <span className="text-lg font-bold text-purple-400">{kpis.pendingLabTests}</span>
            </div>
          </div>
        )}
      </div>

      {/* Subtab Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('patients')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition shrink-0 ${
            activeSubTab === 'patients'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Patient Registration
        </button>

        <button
          onClick={() => setActiveSubTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition shrink-0 ${
            activeSubTab === 'appointments'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Appointments & Scheduling
        </button>

        <button
          onClick={() => setActiveSubTab('queue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition shrink-0 ${
            activeSubTab === 'queue'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Tv className="w-4 h-4" />
          Live Token Queue
        </button>

        <button
          onClick={() => setActiveSubTab('billing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition shrink-0 ${
            activeSubTab === 'billing'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Billing & Invoices
        </button>

        <button
          onClick={() => setActiveSubTab('agents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition shrink-0 ${
            activeSubTab === 'agents'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Percent className="w-4 h-4" />
          Sales Agent Ledger
        </button>

        <button
          onClick={() => setActiveSubTab('tests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition shrink-0 ${
            activeSubTab === 'tests'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          Lab Test Orders
        </button>

        <button
          onClick={() => setActiveSubTab('shifts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition shrink-0 ${
            activeSubTab === 'shifts'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Cash Register & Shifts
        </button>
      </div>

      {/* Render Active Subview */}
      <div>
        {activeSubTab === 'patients' && (
          <PatientsSubview
            onIssueToken={handleIssueTokenForPatient}
            onBookAppointment={handleBookAppointmentForPatient}
            onCreateInvoice={handleCreateInvoiceForPatient}
          />
        )}
        {activeSubTab === 'appointments' && (
          <AppointmentsSubview
            initialPatient={initialPatient}
            onClearInitialPatient={() => setInitialPatient(null)}
          />
        )}
        {activeSubTab === 'queue' && (
          <QueueSubview
            initialPatient={initialPatient}
            onClearInitialPatient={() => setInitialPatient(null)}
          />
        )}
        {activeSubTab === 'billing' && (
          <BillingSubview
            initialPatient={initialPatient}
            onClearInitialPatient={() => setInitialPatient(null)}
          />
        )}
        {activeSubTab === 'agents' && <SalesAgentsSubview />}
        {activeSubTab === 'tests' && <TestOrdersSubview />}
        {activeSubTab === 'shifts' && <ShiftsSubview />}
      </div>
    </div>
  );
};
