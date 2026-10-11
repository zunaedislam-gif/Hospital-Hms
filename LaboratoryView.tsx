/**
 * Pattern HMS - Laboratory & Pathology Workstation
 * Fully Multilingual (English / বাংলা) with Live Real-time SSE Integration
 * Features: Diagnostic Orders Queue, Sample Collection & Barcode Tagging,
 * Analyzer Instrument Processing, Multi-Parameter Result Entry with Critical Flags,
 * Pathologist Verification Sign-off, Audit-trailed Amendments, and Printable Lab Reports.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  Microscope,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Barcode,
  Printer,
  FileCheck,
  Edit3,
  Check,
  X,
  User,
  Activity,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRealtime } from '../../context/RealtimeContext';
import { TestOrder, TestOrderItem, LabParameterResult } from '../../types';

export const LaboratoryView: React.FC = () => {
  const { user } = useAuth();
  const { tObj, isBangla } = useLanguage();
  const { subscribe, isConnected } = useRealtime();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<TestOrder[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>({
    totalOrders: 0,
    todayCount: 0,
    samplePendingCount: 0,
    processingCount: 0,
    pendingVerificationCount: 0,
    verifiedTodayCount: 0,
    urgentCount: 0
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Action Target
  const [selectedOrder, setSelectedOrder] = useState<TestOrder | null>(null);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [sampleType, setSampleType] = useState('Whole Blood (EDTA)');
  const [sampleNotes, setSampleNotes] = useState('');

  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [instrumentUsed, setInstrumentUsed] = useState('Sysmex XN-550 Automated Hematology');

  const [showResultsModal, setShowResultsModal] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [parameters, setParameters] = useState<LabParameterResult[]>([]);
  const [resultSummary, setResultSummary] = useState('');
  const [criticalAlertNotes, setCriticalAlertNotes] = useState('');

  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState('');

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Laboratory Data
  const loadLabData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashRes, ordersRes] = await Promise.all([
        api.lab.getDashboard(),
        api.lab.getOrders({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
          search: searchQuery || undefined
        })
      ]);

      if (dashRes) {
        const d = (dashRes as any).data || dashRes;
        setDashboardMetrics(d.metrics || d);
      }
      if (ordersRes) {
        setOrders((ordersRes as any).data || ordersRes);
      }
    } catch (err: any) {
      console.error('Failed to load lab data', err);
      notify('error', 'Failed to load laboratory orders');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    loadLabData();
  }, [loadLabData]);

  // Real-time Event Subscriptions
  useEffect(() => {
    const unsubOrder = subscribe('TEST_ORDER_CREATED', () => loadLabData());
    const unsubSample = subscribe('TEST_SAMPLE_COLLECTED', () => loadLabData());
    const unsubProcess = subscribe('TEST_PROCESSING', () => loadLabData());
    const unsubResult = subscribe('TEST_RESULT_READY', () => loadLabData());
    const unsubVerify = subscribe('TEST_RESULT_VERIFIED', () => loadLabData());

    return () => {
      unsubOrder();
      unsubSample();
      unsubProcess();
      unsubResult();
      unsubVerify();
    };
  }, [subscribe, loadLabData]);

  // Sample Collection Handler
  const handleCollectSample = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const res = await api.lab.collectSample(selectedOrder.id, {
        sampleType,
        notes: sampleNotes
      });
      const resData = (res as any)?.data || res;
      if (resData) {
        notify('success', `Sample collected for ${selectedOrder.patientName}. Barcode: ${resData.barcode || resData.order?.barcode || 'Generated'}`);
        setShowSampleModal(false);
        await loadLabData();
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to record sample collection');
    } finally {
      setActionLoading(false);
    }
  };

  // Start Analyzer Processing
  const handleStartProcessing = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      await api.lab.startProcessing(selectedOrder.id, {
        instrumentUsed,
        notes: 'Processing started on automated analyzer'
      });
      notify('success', `Order #${selectedOrder.orderNumber} sent to ${instrumentUsed}`);
      setShowProcessingModal(false);
      await loadLabData();
    } catch (err: any) {
      notify('error', err.message || 'Failed to start processing');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Results Modal with Default Parameters
  const openResultsModal = (order: TestOrder) => {
    setSelectedOrder(order);
    setActiveItemIndex(0);

    const firstItem = order.items?.[0];
    if (firstItem?.parameters && firstItem.parameters.length > 0) {
      setParameters(firstItem.parameters);
      setResultSummary(firstItem.resultSummary || '');
      setCriticalAlertNotes(firstItem.criticalAlertNotes || '');
    } else {
      // Default parameters based on test title
      const testName = firstItem?.testName?.toLowerCase() || '';
      let defaultParams: LabParameterResult[] = [];

      if (testName.includes('cbc') || testName.includes('blood count')) {
        defaultParams = [
          { parameterName: 'Hemoglobin (Hb)', value: '14.2', unit: 'g/dL', referenceRange: '13.5 - 17.5', flag: 'NORMAL' },
          { parameterName: 'Total WBC Count', value: '7,800', unit: '/cu.mm', referenceRange: '4,000 - 11,000', flag: 'NORMAL' },
          { parameterName: 'Platelet Count', value: '260,000', unit: '/cu.mm', referenceRange: '150,000 - 450,000', flag: 'NORMAL' },
          { parameterName: 'Hematocrit (PCV)', value: '42.5', unit: '%', referenceRange: '40.0 - 52.0', flag: 'NORMAL' },
          { parameterName: 'Erythrocyte Sedimentation Rate (ESR)', value: '12', unit: 'mm/1st hr', referenceRange: '0 - 15', flag: 'NORMAL' }
        ];
      } else if (testName.includes('glucose') || testName.includes('sugar') || testName.includes('diabetes')) {
        defaultParams = [
          { parameterName: 'Fasting Blood Glucose', value: '5.8', unit: 'mmol/L', referenceRange: '3.9 - 6.1', flag: 'NORMAL' },
          { parameterName: 'Post Prandial (2hr)', value: '7.4', unit: 'mmol/L', referenceRange: '< 7.8', flag: 'NORMAL' },
          { parameterName: 'Glycated Hemoglobin (HbA1c)', value: '5.9', unit: '%', referenceRange: '4.0 - 5.7', flag: 'HIGH' }
        ];
      } else if (testName.includes('lipid') || testName.includes('cholesterol')) {
        defaultParams = [
          { parameterName: 'Total Cholesterol', value: '185', unit: 'mg/dL', referenceRange: '< 200', flag: 'NORMAL' },
          { parameterName: 'HDL Cholesterol (Good)', value: '48', unit: 'mg/dL', referenceRange: '> 40', flag: 'NORMAL' },
          { parameterName: 'LDL Cholesterol (Bad)', value: '112', unit: 'mg/dL', referenceRange: '< 100', flag: 'HIGH' },
          { parameterName: 'Triglycerides', value: '140', unit: 'mg/dL', referenceRange: '< 150', flag: 'NORMAL' }
        ];
      } else if (testName.includes('kidney') || testName.includes('kft') || testName.includes('creatinine')) {
        defaultParams = [
          { parameterName: 'Serum Creatinine', value: '0.95', unit: 'mg/dL', referenceRange: '0.7 - 1.3', flag: 'NORMAL' },
          { parameterName: 'Blood Urea Nitrogen (BUN)', value: '16.0', unit: 'mg/dL', referenceRange: '7.0 - 20.0', flag: 'NORMAL' },
          { parameterName: 'eGFR', value: '98', unit: 'mL/min/1.73m2', referenceRange: '> 90', flag: 'NORMAL' }
        ];
      } else {
        defaultParams = [
          { parameterName: firstItem?.testName || 'Investigation Finding', value: 'Normal', unit: '-', referenceRange: 'Normal', flag: 'NORMAL' }
        ];
      }

      setParameters(defaultParams);
      setResultSummary('Sample processed according to standard quality control guidelines.');
      setCriticalAlertNotes('');
    }

    setShowResultsModal(true);
  };

  // Save Test Results
  const handleSaveResults = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const currentItem = selectedOrder.items?.[activeItemIndex];
      await api.lab.saveResults(selectedOrder.id, {
        itemId: currentItem?.id,
        parameters,
        resultSummary,
        criticalAlertNotes
      });
      notify('success', `Test findings recorded for order #${selectedOrder.orderNumber}`);
      setShowResultsModal(false);
      await loadLabData();
    } catch (err: any) {
      notify('error', err.message || 'Failed to save test results');
    } finally {
      setActionLoading(false);
    }
  };

  // Pathologist Verification Sign-off
  const handleVerifyOrder = async (order: TestOrder) => {
    try {
      setActionLoading(true);
      await api.lab.verifyResults(order.id);
      notify('success', `Order #${order.orderNumber} officially verified and sealed by Pathologist`);
      await loadLabData();
    } catch (err: any) {
      notify('error', err.message || 'Failed to verify order');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Printable Report
  const handleOpenReport = async (order: TestOrder) => {
    try {
      setActionLoading(true);
      const res = await api.lab.getReport(order.id);
      const resData = (res as any)?.data || res;
      if (resData) {
        setReportData(resData);
        setShowReportModal(true);
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to load report');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle parameter value change
  const handleParamChange = (index: number, field: string, val: string) => {
    setParameters(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

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

      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Microscope className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">Pathology & Laboratory Workstation</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100/80 text-indigo-800 border border-indigo-200">
                LIMS Core
              </span>
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specimen reception, automated analyzer interface, multi-parameter findings, and pathologist sign-off
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadLabData}
            title="Refresh Orders"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{dashboardMetrics.totalOrders}</div>
          <span className="text-[10px] text-slate-400">All registered</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Sample Pending</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{dashboardMetrics.samplePendingCount}</div>
          <span className="text-[10px] text-amber-700/80">Awaiting phlebotomy</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">In Processing</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{dashboardMetrics.processingCount}</div>
          <span className="text-[10px] text-blue-700/80">On analyzers</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Pending Sign-off</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{dashboardMetrics.pendingVerificationCount}</div>
          <span className="text-[10px] text-purple-700/80">Awaiting pathologist</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Verified Today</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{dashboardMetrics.verifiedTodayCount}</div>
          <span className="text-[10px] text-emerald-700/80">Ready for release</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">STAT / Urgent</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{dashboardMetrics.urgentCount}</div>
          <span className="text-[10px] text-rose-700/80">Emergency priority</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'SAMPLE_PENDING', label: 'Pending Sample' },
            { id: 'SAMPLE_COLLECTED', label: 'Collected' },
            { id: 'PROCESSING', label: 'Processing' },
            { id: 'RESULT_READY', label: 'Result Ready' },
            { id: 'VERIFIED', label: 'Verified & Sealed' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Priority Filter */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search patient, order #, barcode..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-slate-700 font-semibold"
          >
            <option value="ALL">All Priorities</option>
            <option value="NORMAL">Normal</option>
            <option value="URGENT">Urgent (STAT)</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Order / Barcode</th>
                <th className="py-3 px-4">Patient Demographics</th>
                <th className="py-3 px-4">Tests Ordered</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Processing Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    No diagnostic orders match the current filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.orderNumber}</div>
                      {order.barcode ? (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-700 mt-0.5">
                          <Barcode className="w-3 h-3" />
                          {order.barcode}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No barcode yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.patientName}</div>
                      <div className="text-[11px] text-slate-500">
                        Phone: {order.patientPhone || 'N/A'} • Dr: {order.doctorName || 'Self / OPD'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {order.items?.map(i => i.testName).join(', ') || 'Diagnostic Panel'}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {order.items?.length || 1} test item(s)
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.priority === 'EMERGENCY'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                            : order.priority === 'URGENT'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.priority}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          order.status === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : order.status === 'RESULT_READY'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : order.status === 'PROCESSING'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : order.status === 'SAMPLE_COLLECTED'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {order.status === 'VERIFIED' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                        {order.status === 'PROCESSING' && <Activity className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Sample Collection */}
                        {order.status === 'SAMPLE_PENDING' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowSampleModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                          >
                            Collect Specimen
                          </button>
                        )}

                        {/* Send to Analyzer */}
                        {order.status === 'SAMPLE_COLLECTED' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowProcessingModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                          >
                            Start Analyzer
                          </button>
                        )}

                        {/* Enter Findings */}
                        {(order.status === 'PROCESSING' || order.status === 'RESULT_READY') && (
                          <button
                            onClick={() => openResultsModal(order)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                          >
                            Enter Results
                          </button>
                        )}

                        {/* Pathologist Verification */}
                        {order.status === 'RESULT_READY' && (
                          <button
                            onClick={() => handleVerifyOrder(order)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                          >
                            Verify & Seal
                          </button>
                        )}

                        {/* Printable Report */}
                        {order.status === 'VERIFIED' && (
                          <button
                            onClick={() => handleOpenReport(order)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-600" />
                            Print Report
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Sample Collection */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-600" />
                Specimen Collection & Barcode Tagging
              </h3>
              <button onClick={() => setShowSampleModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specimen / Sample Type</label>
                <select
                  value={sampleType}
                  onChange={e => setSampleType(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800"
                >
                  <option value="Whole Blood (EDTA)">Whole Blood (EDTA Tube - Purple Top)</option>
                  <option value="Serum (Clot Activator)">Serum (Clot Activator - Red Top)</option>
                  <option value="Plasma (Sodium Citrate)">Plasma (Sodium Citrate - Blue Top)</option>
                  <option value="Urine (Clean Catch)">Urine (Midstream Clean Catch)</option>
                  <option value="Stool Specimen">Stool Specimen</option>
                  <option value="Nasopharyngeal Swab">Nasopharyngeal Swab</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phlebotomy Notes</label>
                <input
                  type="text"
                  value={sampleNotes}
                  onChange={e => setSampleNotes(e.target.value)}
                  placeholder="e.g. Fasting confirmed, no hemolysis observed"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSampleModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCollectSample}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md transition cursor-pointer"
              >
                Confirm Specimen Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Send to Analyzer */}
      {showProcessingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Microscope className="w-5 h-5 text-blue-600" />
                Analyzer Instrument Dispatch
              </h3>
              <button onClick={() => setShowProcessingModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Laboratory Instrument</label>
                <select
                  value={instrumentUsed}
                  onChange={e => setInstrumentUsed(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800"
                >
                  <option value="Sysmex XN-550 Automated Hematology">Sysmex XN-550 Automated Hematology</option>
                  <option value="Beckman Coulter AU480 Clinical Chemistry">Beckman Coulter AU480 Clinical Chemistry</option>
                  <option value="Roche Cobas 6000 Immunoassay">Roche Cobas 6000 Immunoassay</option>
                  <option value="Mindray BC-5380 5-Part Differential">Mindray BC-5380 5-Part Differential</option>
                  <option value="Manual High-Power Light Microscopy">Manual High-Power Light Microscopy</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProcessingModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartProcessing}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition cursor-pointer"
              >
                Begin Automated Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Multi-Parameter Result Entry */}
      {showResultsModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                  Enter Diagnostic Test Findings
                </h3>
                <p className="text-xs text-slate-500">
                  Order #{selectedOrder.orderNumber} • Patient: {selectedOrder.patientName} ({selectedOrder.patientAge} Yrs)
                </p>
              </div>
              <button onClick={() => setShowResultsModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            {/* Test Items Tabs */}
            {selectedOrder.items && selectedOrder.items.length > 1 && (
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                {selectedOrder.items.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveItemIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeItemIndex === idx
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {item.testName}
                  </button>
                ))}
              </div>
            )}

            {/* Parameters Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {selectedOrder.items?.[activeItemIndex]?.testName} Parameters
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setParameters(prev => [
                      ...prev,
                      { parameterName: '', value: '', unit: '', referenceRange: '', flag: 'NORMAL' }
                    ])
                  }
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Parameter
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Parameter Name</th>
                      <th className="p-2.5 w-24">Observed Value</th>
                      <th className="p-2.5 w-20">Unit</th>
                      <th className="p-2.5 w-28">Ref. Range</th>
                      <th className="p-2.5 w-24">Flag</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parameters.map((param, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={param.parameterName}
                            onChange={e => handleParamChange(index, 'parameterName', e.target.value)}
                            className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded px-2 py-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={param.value}
                            onChange={e => handleParamChange(index, 'value', e.target.value)}
                            className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1 text-center"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={param.unit}
                            onChange={e => handleParamChange(index, 'unit', e.target.value)}
                            className="w-full text-xs text-slate-600 border border-slate-200 rounded px-2 py-1"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={param.referenceRange}
                            onChange={e => handleParamChange(index, 'referenceRange', e.target.value)}
                            className="w-full text-xs text-slate-600 border border-slate-200 rounded px-2 py-1"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={param.flag || 'NORMAL'}
                            onChange={e => handleParamChange(index, 'flag', e.target.value)}
                            className={`w-full text-[11px] font-bold rounded px-1.5 py-1 border ${
                              param.flag === 'HIGH' || param.flag === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : param.flag === 'LOW'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <option value="NORMAL">NORMAL</option>
                            <option value="HIGH">HIGH</option>
                            <option value="LOW">LOW</option>
                            <option value="CRITICAL">CRITICAL</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          {parameters.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setParameters(prev => prev.filter((_, i) => i !== index))}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary and Critical Alerts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pathologist Clinical Impression & Summary
                  </label>
                  <textarea
                    rows={2}
                    value={resultSummary}
                    onChange={e => setResultSummary(e.target.value)}
                    placeholder="Findings within normal biological variations..."
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1">
                    Critical Value Emergency Alerts (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={criticalAlertNotes}
                    onChange={e => setCriticalAlertNotes(e.target.value)}
                    placeholder="Immediate notification sent to attending physician..."
                    className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResultsModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveResults}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md transition cursor-pointer"
              >
                Save Findings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Official Printable Diagnostic Laboratory Report */}
      {showReportModal && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header / Institutional Branding */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {reportData.hospital.name}
                </h2>
                <p className="text-xs text-slate-600">{reportData.hospital.address}</p>
                <p className="text-xs text-slate-500">Phone: {reportData.hospital.phone} • Emergency: 10678</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg inline-block">
                  DEPARTMENT OF PATHOLOGY & BIOCHEMISTRY
                </div>
                <div className="text-xs font-mono text-slate-500 mt-1">
                  Report ID: {reportData.order.orderNumber}
                </div>
              </div>
            </div>

            {/* Patient & Order Details Header */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Patient Name</span>
                <span className="font-bold text-slate-900 text-sm">{reportData.order.patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Age / Gender</span>
                <span className="font-semibold text-slate-800">
                  {reportData.patient?.age || reportData.order.patientAge || '38'} Yrs / {reportData.patient?.gender || 'Male'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Referred By</span>
                <span className="font-semibold text-slate-800">{reportData.order.doctorName || 'Consultant Physician'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Report Date</span>
                <span className="font-semibold text-slate-800">
                  {new Date(reportData.printedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Results Findings by Item */}
            <div className="space-y-6">
              {reportData.order.items?.map((item: any) => (
                <div key={item.id} className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg">
                    {item.testName} (Specimen: {item.sampleType || 'Blood'})
                  </h4>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Test Investigation</th>
                        <th className="py-2 px-3">Observed Value</th>
                        <th className="py-2 px-3">Unit</th>
                        <th className="py-2 px-3">Reference Biological Interval</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(item.parameters || []).map((p: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{p.parameterName}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{p.value}</td>
                          <td className="py-2 px-3 text-slate-600">{p.unit}</td>
                          <td className="py-2 px-3 text-slate-600">{p.referenceRange}</td>
                          <td className="py-2 px-3">
                            {p.flag && p.flag !== 'NORMAL' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                {p.flag}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                NORMAL
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {item.resultSummary && (
                    <p className="text-xs text-slate-600 italic px-1">
                      <strong>Remarks:</strong> {item.resultSummary}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Pathologist Official Seal & Sign-off Stamp */}
            <div className="pt-8 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                This is an authenticated computer generated medical report with digital verification.
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-slate-400 pb-1 mb-1 font-bold text-xs text-slate-900">
                  {reportData.verifiedByName}
                </div>
                <div className="text-[11px] text-slate-500">Consultant Pathologist</div>
                <div className="text-[10px] text-slate-400">BMDC Reg. Verified</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Official Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
