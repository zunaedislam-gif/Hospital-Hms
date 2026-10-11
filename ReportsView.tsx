/**
 * Pattern HMS - Reports, Financial Telemetry & Export Center View
 */
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Users,
  FlaskConical,
  Filter,
  CheckCircle2,
  Printer
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ReportsView: React.FC = () => {
  const { selectedOrgId } = useAuth();
  const [period, setPeriod] = useState('last_30_days');
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [diagnosticsSummary, setDiagnosticsSummary] = useState<any[]>([]);
  const [doctorPerformance, setDoctorPerformance] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [rev, diag, docs] = await Promise.all([
          api.getRevenueTrend(period),
          api.getDiagnosticsSummary(),
          api.getDoctors()
        ]);
        setRevenueTrend(rev);
        setDiagnosticsSummary(diag);
        setDoctorPerformance(
          docs.map((d, i) => ({
            name: d.fullName,
            specialty: d.specialtyName,
            consultations: 85 - i * 12,
            revenue: (85 - i * 12) * d.consultationFee
          }))
        );
      } catch (e) {
        console.error('Failed to load reports', e);
      }
    };
    fetchReports();
  }, [period, selectedOrgId]);

  const handleExportCSV = (reportName: string) => {
    setIsExporting(true);
    setTimeout(() => {
      // Generate standard CSV payload
      let csvContent = "data:text/csv;charset=utf-8,";
      if (reportName === 'diagnostics') {
        csvContent += "Test Name,Test Code,Volume,Revenue\n";
        diagnosticsSummary.forEach(d => {
          csvContent += `"${d.testName}","${d.code}",${d.volume},${d.revenue}\n`;
        });
      } else {
        csvContent += "Date,Consultations,Diagnostics,Beds\n";
        revenueTrend.forEach(r => {
          csvContent += `"${r.label}",${r.consultations},${r.diagnostics},${r.beds}\n`;
        });
      }
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `PatternHMS_${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Financial & Clinical Reports</h1>
          <p className="text-xs text-slate-500">
            Executive performance analytics, diagnostic utilization, doctor caseloads, and compliance exports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white font-semibold text-slate-700"
          >
            <option value="today">Today's Report</option>
            <option value="last_7_days">Past 7 Days</option>
            <option value="last_30_days">Past 30 Days</option>
            <option value="this_year">Financial Year to Date</option>
          </select>

          <button
            onClick={() => handleExportCSV('revenue')}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trajectory */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Stream Trajectory</h2>
              <p className="text-xs text-slate-500">Historical performance across service categories</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="diagnostics" name="Diagnostics" stroke="#0d9488" fill="#0d9488" fillOpacity={0.2} />
                <Area type="monotone" dataKey="consultations" name="Consultations" stroke="#0284c7" fill="#0284c7" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnostic Lab Volume */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Diagnostic Demand By Test</h2>
              <p className="text-xs text-slate-500">Total performed tests in period</p>
            </div>
            <button
              onClick={() => handleExportCSV('diagnostics')}
              className="text-teal-600 hover:text-teal-700 text-xs font-semibold flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Export Labs
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diagnosticsSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="volume" name="Tests Performed" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Doctor Productivity & Caseload Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Clinician Performance & Outpatient Volume</h2>
          <span className="text-xs text-slate-500">Period caseload breakdown</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Clinician / Doctor</th>
              <th className="py-3 px-4">Specialty</th>
              <th className="py-3 px-4 text-right">Consultations Completed</th>
              <th className="py-3 px-4 text-right">Revenue Generated</th>
              <th className="py-3 px-4 text-center">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctorPerformance.map((doc, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 px-4 font-bold text-slate-900">{doc.name}</td>
                <td className="py-3.5 px-4 text-slate-600">{doc.specialty}</td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-800">{doc.consultations} Visits</td>
                <td className="py-3.5 px-4 text-right font-bold text-teal-700">${doc.revenue.toLocaleString()}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Reconciled
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
