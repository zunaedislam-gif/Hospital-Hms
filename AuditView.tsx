/**
 * Pattern HMS - Audit Trails, Security Logs & Diff Inspector View
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  Clock,
  User,
  Activity,
  Layers,
  CheckCircle2,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [selectedLogForDiff, setSelectedLogForDiff] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      const data = await api.getAuditLogs({ module: moduleFilter !== 'ALL' ? moduleFilter : undefined });
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs', e);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);

  const filteredLogs = logs.filter(l => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.userName.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.ipAddress.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Timestamp,User,Action,Module,Description,IP Address\n";
    filteredLogs.forEach(l => {
      csvContent += `"${l.timestamp}","${l.userName}","${l.action}","${l.module}","${l.description}","${l.ipAddress}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PatternHMS_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">System Audit & Compliance Logs</h1>
          <p className="text-xs text-slate-500">
            Immutable tracking of user activities, data modifications, security events, and tariff revisions
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          Export Audit Trail
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs by staff name, action, IP..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
          >
            <option value="ALL">All System Modules</option>
            <option value="AUTH">Authentication</option>
            <option value="ORGANIZATIONS">Organizations & Branches</option>
            <option value="USERS">Users & Access Control</option>
            <option value="CLINICAL">Clinical & Doctors</option>
            <option value="DIAGNOSTICS">Diagnostics & Pricing</option>
            <option value="QUEUE">Queue & Voice</option>
            <option value="BEDS">Beds & Wards</option>
            <option value="BILLING">Billing & Taxes</option>
            <option value="SETTINGS">System Settings</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator / Staff</th>
                <th className="py-3 px-4">Action & Module</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Data Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString([], {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.userName}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-slate-800 text-[11px] block">
                      {log.action}
                    </span>
                    <span className="inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-slate-100 text-slate-600">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                    {log.description}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {log.ipAddress}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {(log.oldValues || log.newValues) ? (
                      <button
                        onClick={() => setSelectedLogForDiff(log)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition border border-teal-200"
                      >
                        <Eye className="w-3 h-3" /> View Diff
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300">No Diff</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Old Value vs New Value Diff Inspector */}
      {selectedLogForDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">State Mutation Diff Inspector</h3>
                <p className="text-[11px] text-slate-500">{selectedLogForDiff.description}</p>
              </div>
              <button onClick={() => setSelectedLogForDiff(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Old Values */}
                <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2">
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Previous State (Old)
                  </div>
                  <pre className="p-3 bg-white rounded-lg border border-rose-100 text-[11px] font-mono text-rose-900 overflow-x-auto max-h-64">
                    {selectedLogForDiff.oldValues ? JSON.stringify(selectedLogForDiff.oldValues, null, 2) : '// No previous state recorded'}
                  </pre>
                </div>

                {/* New Values */}
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    Mutated State (New)
                  </div>
                  <pre className="p-3 bg-white rounded-lg border border-emerald-100 text-[11px] font-mono text-emerald-900 overflow-x-auto max-h-64">
                    {selectedLogForDiff.newValues ? JSON.stringify(selectedLogForDiff.newValues, null, 2) : '// No new state recorded'}
                  </pre>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span>Committed by {selectedLogForDiff.userName} ({selectedLogForDiff.ipAddress})</span>
                <span className="font-mono">{new Date(selectedLogForDiff.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
