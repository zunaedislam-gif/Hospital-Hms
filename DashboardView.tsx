/**
 * Pattern HMS - Super Admin Command Center Dashboard
 * Fully Multilingual (English / বাংলা)
 */
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  UserCheck,
  Stethoscope,
  FlaskConical,
  BedDouble,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Tv,
  Receipt,
  FileCheck,
  AlertCircle,
  Plus,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DashboardKPIs, NavigationTab } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickAction: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenQuickAction }) => {
  const { selectedOrgId } = useAuth();
  const { tObj, isBangla, formatNumber, formatMoney } = useLanguage();
  const [period, setPeriod] = useState<string>('last_7_days');
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [patientData, setPatientData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [topTests, setTopTests] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [kpiRes, revRes, patRes, payRes, testRes, actRes] = await Promise.all([
        api.getKPIs({ period, orgId: selectedOrgId || undefined }),
        api.getRevenueTrend(period),
        api.getPatientTrend(),
        api.getPaymentDistribution(),
        api.getDiagnosticsSummary(),
        api.getActivityLogs()
      ]);
      setKpis(kpiRes);
      setRevenueData(revRes);
      setPatientData(patRes);
      setPaymentData(payRes);
      setTopTests(testRes);
      setActivities(actRes);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period, selectedOrgId]);

  const periodsList = [
    { id: 'today', label: isBangla ? 'আজ' : 'Today' },
    { id: 'last_7_days', label: isBangla ? '৭ দিন' : '7 Days' },
    { id: 'last_30_days', label: isBangla ? '৩০ দিন' : '30 Days' },
    { id: 'this_year', label: isBangla ? 'এই বছর' : 'This Year' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{tObj.dashboard.title}</h1>
          <p className="text-xs text-slate-500">
            {tObj.dashboard.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            {periodsList.map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  period === p.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboardData}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
            title={tObj.common.refresh}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Organizations */}
        <div 
          onClick={() => onNavigate('organizations')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-500/40 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isBangla ? 'হাসপাতাল ও সেন্টার' : 'Hospitals & Centers'}
            </span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber((kpis?.organizations?.totalHospitals || 0) + (kpis?.organizations?.totalDiagnosticCenters || 0))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{formatNumber(kpis?.organizations?.totalHospitals || 0)} {isBangla ? 'হাসপাতাল' : 'Hospitals'}</span>
            <span className="text-emerald-600 font-semibold">{formatNumber(kpis?.organizations?.activeOrganizations || 0)} {tObj.common.active}</span>
          </div>
        </div>

        {/* 2. Staff & Doctors */}
        <div 
          onClick={() => onNavigate('users')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-sky-500/40 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isBangla ? 'ডাক্তার ও স্টাফ' : 'Staff & Doctors'}
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(kpis?.users?.totalUsers || 0)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{formatNumber(kpis?.users?.doctors || 0)} {isBangla ? 'চিকিৎসক' : 'Doctors'}</span>
            <span className="text-sky-600 font-semibold">{formatNumber(kpis?.users?.activeUsers || 0)} {tObj.common.active}</span>
          </div>
        </div>

        {/* 3. Patients / Appointments */}
        <div 
          onClick={() => onNavigate('queue')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-indigo-500/40 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isBangla ? 'আজকের সিরিয়াল' : "Today's Visits"}
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(kpis?.patients?.todayAppointments || 0)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{formatNumber(kpis?.patients?.todayRegistered || 0)} {isBangla ? 'নিবন্ধিত' : 'Registered'}</span>
            <span className="text-emerald-600 font-semibold">{formatNumber(kpis?.patients?.todayCompletedAppointments || 0)} {isBangla ? 'সম্পন্ন' : 'Served'}</span>
          </div>
        </div>

        {/* 4. Diagnostics */}
        <div 
          onClick={() => onNavigate('diagnostics')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-purple-500/40 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isBangla ? 'ডায়াগনস্টিক টেস্ট' : 'Diagnostic Tests'}
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(kpis?.diagnostics?.totalTests || 0)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{formatNumber(kpis?.diagnostics?.testsPerformedToday || 0)} {isBangla ? 'আজ সম্পন্ন' : 'Done Today'}</span>
            <span className="text-amber-600 font-semibold">{formatNumber(kpis?.diagnostics?.pendingLaboratoryTests || 0)} {isBangla ? 'ল্যাবে পেন্ডিং' : 'In Lab'}</span>
          </div>
        </div>

        {/* 5. Revenue */}
        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-emerald-500/40 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isBangla ? 'আজকের রাজস্ব' : 'Period Revenue'}
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatMoney(kpis?.financial?.todayRevenue || 0, 'BDT')}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>{isBangla ? 'মাসিক:' : 'Run:'} {formatMoney(kpis?.financial?.monthlyRevenue || 0, 'BDT')}</span>
            <span className="text-emerald-600 font-semibold flex items-center">
              +14% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 6. Bed Occupancy */}
        <div 
          onClick={() => onNavigate('beds')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-rose-500/40 hover:shadow-xs transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isBangla ? 'হাসপাতাল বেড' : 'Bed Capacity'}
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(kpis?.infrastructure?.totalBeds || 0)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-rose-600 font-semibold">{formatNumber(kpis?.infrastructure?.occupiedBeds || 0)} {isBangla ? 'পূর্ণ' : 'Occupied'}</span>
            <span className="text-emerald-600 font-semibold">{formatNumber(kpis?.infrastructure?.availableBeds || 0)} {isBangla ? 'খালি' : 'Free'}</span>
          </div>
        </div>
      </div>

      {/* Main Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analytics (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{tObj.dashboard.revenueTrend}</h2>
              <p className="text-xs text-slate-500">
                {isBangla ? 'ডাক্তার কনসালটেশন, প্যাথলজি ল্যাব ও ইনপেশেন্ট বেড রাজস্ব' : 'Consultations, Laboratory Diagnostics & Inpatient Admissions'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-teal-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span> {isBangla ? 'ডায়াগনস্টিক' : 'Diagnostics'}
              </span>
              <span className="flex items-center gap-1.5 text-sky-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> {isBangla ? 'কনসালটেশন' : 'Consultations'}
              </span>
              <span className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> {isBangla ? 'বেড ভর্তি' : 'Bed Admissions'}
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDiag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => isBangla ? `৳${formatNumber(v)}` : `$${v}`} />
                <Tooltip
                  formatter={(val: any) => [formatMoney(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="diagnostics" name={isBangla ? 'ডায়াগনস্টিক' : 'Diagnostics'} stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorDiag)" />
                <Area type="monotone" dataKey="consultations" name={isBangla ? 'কনসালটেশন' : 'Consultations'} stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorCons)" />
                <Area type="monotone" dataKey="beds" name={isBangla ? 'ইনপেশেন্ট বেড' : 'Inpatient Beds'} stroke="#6366f1" strokeWidth={1.5} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Distribution (1 Column) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{tObj.dashboard.paymentDistribution}</h2>
            <p className="text-xs text-slate-500 mb-2">
              {isBangla ? 'কাউন্টার ক্যাশ, ব্যাংক কার্ড ও বিকাশ / নগদ ওয়ালেট' : 'Counter Cash, POS Cards & Digital Mobile Wallets'}
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || '#0d9488'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${formatNumber(val)}%`, isBangla ? 'অনুপাত' : 'Share']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {paymentData.slice(0, 4).map((p) => (
              <div key={p.name} className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.fill }} />
                  <span className="truncate max-w-[150px]">{p.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{formatNumber(p.value)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Registrations & Appointment Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{tObj.dashboard.patientTrend}</h2>
              <p className="text-xs text-slate-500">
                {isBangla ? 'নতুন রোগী নিবন্ধন বনাম আউটডোর চিকিৎসা' : 'Registrations vs Outpatient Consultations'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('queue')}
              className="text-teal-600 hover:text-teal-700 text-xs font-semibold cursor-pointer"
            >
              {isBangla ? 'সিরিয়াল তালিকা →' : 'Queue Fleet →'}
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={patientData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="registrations" name={isBangla ? 'নতুন রোগী' : 'New Patients'} fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="appointments" name={isBangla ? 'সম্পন্ন ভিজিট' : 'Completed Visits'} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Diagnostic Tests Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{tObj.dashboard.topDiagnosticTests}</h2>
              <p className="text-xs text-slate-500">
                {isBangla ? 'সকল শাখার ল্যাব টেস্টের চাহিদা ও সংগৃহীত ফি' : 'Test demand across all laboratory branches'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('diagnostics')}
              className="text-teal-600 hover:text-teal-700 text-xs font-semibold cursor-pointer"
            >
              {isBangla ? 'মূল্যতালিকা →' : 'Catalog →'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-2">{isBangla ? 'টেস্টের নাম' : 'Test Name'}</th>
                  <th className="pb-2 text-right">{isBangla ? 'সংখ্যা' : 'Volume'}</th>
                  <th className="pb-2 text-right">{isBangla ? 'রাজস্ব' : 'Revenue'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topTests.slice(0, 5).map((t) => (
                  <tr key={t.code} className="hover:bg-slate-50/60">
                    <td className="py-2 font-medium text-slate-800">
                      <div className="truncate max-w-[140px]">{t.testName}</div>
                      <div className="text-[10px] text-slate-400">{t.code}</div>
                    </td>
                    <td className="py-2 text-right text-slate-600 font-semibold">{formatNumber(t.volume)}</td>
                    <td className="py-2 text-right text-teal-700 font-semibold">{formatMoney(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time System Activity Stream */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{tObj.dashboard.recentSystemActivity}</h2>
                <p className="text-xs text-slate-500">
                  {isBangla ? 'হাসপাতাল শাখার লাইভ সিস্টেম ইভেন্ট' : 'Live events across medical branches'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('audit')}
                className="text-teal-600 hover:text-teal-700 text-xs font-semibold cursor-pointer"
              >
                {isBangla ? 'সব লগ →' : 'All Logs →'}
              </button>
            </div>

            <div className="space-y-3">
              {activities.slice(0, 4).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 leading-tight">{act.title}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-1">{act.description}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => onNavigate('clinical')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200 transition cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              {isBangla ? 'ডাক্তার তালিকা' : 'Doctor Roster'}
            </button>
            <button
              onClick={() => onNavigate('queue')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200 transition cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-sky-600" />
              {isBangla ? 'ওয়েটিং ডিসপ্লে' : 'Waiting Displays'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
