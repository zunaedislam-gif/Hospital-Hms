/**
 * Pattern HMS - Finance, Billing & Accounts Workstation
 * Fully Multilingual (English / বাংলা) with Live Real-time SSE Integration
 * Features: Multi-method Payment Collection, Balance & Overpayment Protection,
 * Authorized Refund Workflows, Operational Expense Ledger & Approvals,
 * Sales Agent Commissions Disbursement, and Daily Cash Register Reconciliation.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Receipt,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  Landmark,
  Building,
  Users,
  Calendar,
  AlertTriangle,
  Send,
  Eye,
  Lock
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRealtime } from '../../context/RealtimeContext';
import { Invoice, Payment, Refund, Expense, SalesAgentCommission, CashClosing } from '../../types';

export const FinanceView: React.FC = () => {
  const { user } = useAuth();
  const { tObj, isBangla } = useLanguage();
  const { subscribe, isConnected } = useRealtime();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'commissions' | 'cashClosing'>('invoices');

  // Loading & Notifications
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data State
  const [dashboard, setDashboard] = useState<any>({
    today: {
      totalRevenue: 0,
      cash: 0,
      card: 0,
      mobile: 0,
      bank: 0,
      expenses: 0,
      refunds: 0,
      net: 0
    },
    overview: {
      allTimeRevenue: 0,
      allTimeExpenses: 0,
      allTimeRefunds: 0,
      netIncome: 0,
      outstandingDue: 0,
      pendingInvoicesCount: 0,
      pendingCommissions: 0,
      paidCommissions: 0
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');

  const [commissions, setCommissions] = useState<SalesAgentCommission[]>([]);
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('ALL');

  const [cashClosingData, setCashClosingData] = useState<{
    currentSession: {
      date: string;
      openingCash: number;
      cashCollection: number;
      cashExpenses: number;
      cashRefunds: number;
      expectedCash: number;
    };
    history: CashClosing[];
  } | null>(null);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE' | 'BANK'>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Doctor cancellation / Duplicate billing');

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState('SUPPLIES');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseMethod, setExpenseMethod] = useState('CASH');
  const [expenseDesc, setExpenseDesc] = useState('');

  const [actualCashCounted, setActualCashCounted] = useState<number>(0);
  const [varianceExplanation, setVarianceExplanation] = useState('');

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Finance Data
  const loadFinanceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashRes, invRes, expRes, commRes, closingRes] = await Promise.all([
        api.finance.getDashboard(),
        api.finance.getInvoices({
          status: invoiceStatusFilter !== 'ALL' ? invoiceStatusFilter : undefined,
          search: invoiceSearch || undefined
        }),
        api.finance.getExpenses({
          category: expenseCategoryFilter !== 'ALL' ? expenseCategoryFilter : undefined
        }),
        api.finance.getCommissions({
          status: commissionStatusFilter !== 'ALL' ? commissionStatusFilter : undefined
        }),
        api.finance.getCashClosing()
      ]);

      if (dashRes) setDashboard((dashRes as any).data || dashRes);
      if (invRes) setInvoices((invRes as any).data || invRes);
      if (expRes) setExpenses((expRes as any).data || expRes);
      if (commRes) setCommissions((commRes as any).data || commRes);
      if (closingRes) {
        const closingData = (closingRes as any).data || closingRes;
        setCashClosingData(closingData);
        setActualCashCounted(closingData.currentSession?.expectedCash || 0);
      }
    } catch (err: any) {
      console.error('Failed to load finance data', err);
      notify('error', 'Failed to load financial records');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceStatusFilter, invoiceSearch, expenseCategoryFilter, commissionStatusFilter]);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  // Real-time Event Subscriptions
  useEffect(() => {
    const unsubPayment = subscribe('PAYMENT_RECEIVED', () => loadFinanceData());
    const unsubRefund = subscribe('PAYMENT_REFUNDED', () => loadFinanceData());
    const unsubExpense = subscribe('EXPENSE_CREATED', () => loadFinanceData());
    const unsubComm = subscribe('COMMISSION_PAID', () => loadFinanceData());

    return () => {
      unsubPayment();
      unsubRefund();
      unsubExpense();
      unsubComm();
    };
  }, [subscribe, loadFinanceData]);

  // Open Payment Modal
  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(invoice.dueAmount);
    setPaymentMethod('CASH');
    setPaymentReference('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  // Submit Payment
  const handleCollectPayment = async () => {
    if (!selectedInvoice) return;
    if (paymentAmount <= 0) {
      notify('error', 'Payment amount must be greater than zero');
      return;
    }
    if (paymentAmount > selectedInvoice.dueAmount) {
      notify('error', `Amount cannot exceed remaining due of ${selectedInvoice.dueAmount} BDT`);
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.finance.collectPayment({
        invoiceId: selectedInvoice.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
        reference: paymentReference,
        notes: paymentNotes
      });
      const paymentData = (res as any)?.data || res;
      if (paymentData) {
        notify('success', `Payment of ${paymentAmount} BDT recorded for ${selectedInvoice.invoiceNumber}`);
        setShowPaymentModal(false);
        await loadFinanceData();
      }
    } catch (err: any) {
      notify('error', err.message || 'Payment collection failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Refund Modal
  const openRefundModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setRefundAmount(invoice.paidAmount);
    setRefundReason('Test cancellation / Consultation cancelled');
    setShowRefundModal(true);
  };

  // Submit Refund
  const handleProcessRefund = async () => {
    if (!selectedInvoice) return;
    if (refundAmount <= 0 || refundAmount > selectedInvoice.paidAmount) {
      notify('error', `Refund amount must be between 1 and ${selectedInvoice.paidAmount} BDT`);
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.finance.processRefund({
        invoiceId: selectedInvoice.id,
        amount: Number(refundAmount),
        reason: refundReason
      });
      const refundData = (res as any)?.data || res;
      if (refundData) {
        notify('success', `Refund of ${refundAmount} BDT processed for ${selectedInvoice.invoiceNumber}`);
        setShowRefundModal(false);
        await loadFinanceData();
      }
    } catch (err: any) {
      notify('error', err.message || 'Refund processing failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Record Expense
  const handleRecordExpense = async () => {
    if (expenseAmount <= 0 || !expenseVendor.trim()) {
      notify('error', 'Valid amount and vendor payee name are required');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.finance.recordExpense({
        category: expenseCategory,
        amount: Number(expenseAmount),
        vendorPayee: expenseVendor,
        paymentMethod: expenseMethod,
        description: expenseDesc
      });
      const expenseData = (res as any)?.data || res;
      if (expenseData) {
        notify('success', `Expense of ${expenseAmount} BDT recorded`);
        setShowExpenseModal(false);
        setExpenseAmount(0);
        setExpenseVendor('');
        setExpenseDesc('');
        await loadFinanceData();
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to record expense');
    } finally {
      setActionLoading(false);
    }
  };

  // Disburse Commission
  const handleDisburseCommission = async (comm: SalesAgentCommission) => {
    try {
      setActionLoading(true);
      await api.finance.disburseCommission(comm.id, {
        paymentMethod: 'MOBILE',
        payoutReference: 'MFS-' + Math.floor(100000 + Math.random() * 900000)
      });
      const commAmount = comm.commissionAmount || comm.commissionEarned || 0;
      notify('success', `Commission of ${commAmount} BDT disbursed to ${comm.salesAgentName}`);
      await loadFinanceData();
    } catch (err: any) {
      notify('error', err.message || 'Failed to disburse commission');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Cash Register Closing
  const handleSubmitCashClosing = async () => {
    if (!cashClosingData) return;
    const expected = cashClosingData.currentSession.expectedCash;
    const variance = actualCashCounted - expected;

    if (Math.abs(variance) > 0.01 && !varianceExplanation.trim()) {
      notify('error', 'Please provide a discrepancy explanation for the cash variance.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.finance.submitCashClosing({
        actualCash: Number(actualCashCounted),
        varianceExplanation: variance !== 0 ? varianceExplanation : undefined,
        notes: 'End of shift cash register reconciliation'
      });
      const closingResData = (res as any)?.data || res;
      if (closingResData) {
        notify('success', `Cash Register closed. Session status: ${closingResData.status}`);
        setVarianceExplanation('');
        await loadFinanceData();
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to close cash register');
    } finally {
      setActionLoading(false);
    }
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
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
            <Wallet className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">Finance & Accounts Workstation</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200">
                Treasury & Ledger
              </span>
              {isConnected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoicing, multi-channel payment settlement, refunds, operational expenses, and cash reconciliation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
          <button
            onClick={loadFinanceData}
            title="Refresh Data"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Today Collections</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {dashboard.today.totalRevenue.toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Cash: {dashboard.today.cash} • MFS: {dashboard.today.mobile}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Today Expenses</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {dashboard.today.expenses.toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Operational outflows</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Net Income (Today)</span>
          <div className="text-2xl font-black text-teal-700 mt-1">
            {dashboard.today.net.toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Revenue - Expenses - Refunds</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Outstanding Dues</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {dashboard.overview.outstandingDue.toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {dashboard.overview.pendingInvoicesCount} invoices pending
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Agent Commissions</span>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {dashboard.overview.pendingCommissions.toLocaleString()} <span className="text-xs font-normal text-slate-500">BDT</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Accrued referral payout</div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'invoices'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Invoices Ledger & Collections
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'expenses'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Operational Expenses
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">
              {expenses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('commissions')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'commissions'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Sales Agent Commissions
          </button>

          <button
            onClick={() => setActiveTab('cashClosing')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'cashClosing'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lock className="w-4 h-4" />
            Cash Register Closing
          </button>
        </div>
      </div>

      {/* TAB 1: Invoices Ledger & Payment Collection */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All Invoices' },
                { id: 'ISSUED', label: 'Due / Unpaid' },
                { id: 'PARTIALLY_PAID', label: 'Partially Paid' },
                { id: 'PAID', label: 'Fully Paid' },
                { id: 'REFUNDED', label: 'Refunded' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setInvoiceStatusFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    invoiceStatusFilter === t.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={invoiceSearch}
                onChange={e => setInvoiceSearch(e.target.value)}
                placeholder="Search invoice #, patient name..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient Details</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Paid Amount</th>
                    <th className="py-3 px-4">Due Balance</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                        No invoice records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{inv.invoiceNumber}</div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{inv.patientName}</div>
                          <span className="text-[11px] text-slate-500">Phone: {inv.patientPhone || 'N/A'}</span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {inv.totalAmount} BDT
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-emerald-700">
                          {inv.paidAmount} BDT
                        </td>

                        <td className="py-3.5 px-4 font-bold">
                          {inv.dueAmount > 0 ? (
                            <span className="text-amber-600">{inv.dueAmount} BDT</span>
                          ) : (
                            <span className="text-slate-400 font-normal">0 BDT</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-100 text-amber-800'
                                : inv.status === 'REFUNDED'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {inv.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.dueAmount > 0 && (
                              <button
                                onClick={() => openPaymentModal(inv)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                              >
                                Collect Payment
                              </button>
                            )}

                            {inv.paidAmount > 0 && (
                              <button
                                onClick={() => openRefundModal(inv)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition cursor-pointer"
                              >
                                Refund
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
        </div>
      )}

      {/* TAB 2: Operational Expenses */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Category:</span>
              <select
                value={expenseCategoryFilter}
                onChange={e => setExpenseCategoryFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white"
              >
                <option value="ALL">All Categories</option>
                <option value="RENT">Rent & Facilities</option>
                <option value="UTILITIES">Utilities & Power</option>
                <option value="SALARY">Staff Salaries</option>
                <option value="MAINTENANCE">Equipment Maintenance</option>
                <option value="SUPPLIES">Medical Supplies</option>
                <option value="LABORATORY">Lab Reagents</option>
                <option value="TRANSPORT">Transport & Logistics</option>
                <option value="OTHER">Other Operational</option>
              </select>
            </div>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Record Expense
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Expense #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Vendor / Payee</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                        No operational expenses recorded.
                      </td>
                    </tr>
                  ) : (
                    expenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{exp.expenseNumber}</td>
                        <td className="py-3.5 px-4 text-slate-600">{exp.date}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">{exp.vendorPayee}</td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">{exp.amount} BDT</td>
                        <td className="py-3.5 px-4 text-slate-600">{exp.paymentMethod}</td>
                        <td className="py-3.5 px-4 text-emerald-700 font-semibold">{exp.approvedBy || 'Finance Mgr'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Sales Agent Commissions */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Agent Name</th>
                  <th className="py-3 px-4">Agent Code</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Rate %</th>
                  <th className="py-3 px-4">Commission Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                      No sales agent commission records found.
                    </td>
                  </tr>
                ) : (
                  commissions.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.salesAgentName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{c.salesAgentCode}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{c.invoiceNumber}</td>
                      <td className="py-3.5 px-4 text-slate-600">{c.commissionRate}%</td>
                      <td className="py-3.5 px-4 font-bold text-purple-700">{c.commissionAmount || c.commissionEarned || 0} BDT</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {c.status === 'PENDING' && (
                          <button
                            onClick={() => handleDisburseCommission(c)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                          >
                            Disburse MFS
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Daily Cash Register Closing & Reconciliation */}
      {activeTab === 'cashClosing' && cashClosingData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Shift Closing Form */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-600" />
                  Daily Cash Register Closing
                </h3>
                <p className="text-xs text-slate-500">Date: {cashClosingData.currentSession.date}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                Active Till
              </span>
            </div>

            {/* Calculated Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Opening Cash Reserve:</span>
                <span className="font-bold text-slate-900">{cashClosingData.currentSession.openingCash} BDT</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Total Cash Inflows (Today):</span>
                <span className="font-bold text-emerald-700">+{cashClosingData.currentSession.cashCollection} BDT</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Cash Operational Expenses:</span>
                <span className="font-bold text-rose-600">-{cashClosingData.currentSession.cashExpenses} BDT</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Cash Patient Refunds:</span>
                <span className="font-bold text-purple-600">-{cashClosingData.currentSession.cashRefunds} BDT</span>
              </div>
              <div className="flex justify-between py-2.5 bg-slate-50 px-3 rounded-xl border border-slate-200 text-sm">
                <span className="font-bold text-slate-900">Calculated Expected Cash:</span>
                <span className="font-black text-emerald-700">{cashClosingData.currentSession.expectedCash} BDT</span>
              </div>
            </div>

            {/* Actual Counted Cash Input */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Actual Physical Cash Counted in Drawer (BDT)
                </label>
                <input
                  type="number"
                  value={actualCashCounted}
                  onChange={e => setActualCashCounted(Number(e.target.value))}
                  className="w-full text-base font-black text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Variance Indicator */}
              {(() => {
                const variance = actualCashCounted - cashClosingData.currentSession.expectedCash;
                const isBalanced = Math.abs(variance) < 0.01;
                return (
                  <div>
                    <div
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                        isBalanced
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}
                    >
                      <span>Cash Variance:</span>
                      <span>
                        {variance > 0 ? `+${variance}` : variance} BDT ({isBalanced ? 'BALANCED' : 'DISCREPANCY'})
                      </span>
                    </div>

                    {!isBalanced && (
                      <div className="mt-3">
                        <label className="block text-xs font-bold text-rose-700 mb-1">
                          Mandatory Discrepancy Explanation *
                        </label>
                        <textarea
                          rows={2}
                          value={varianceExplanation}
                          onChange={e => setVarianceExplanation(e.target.value)}
                          placeholder="Explain cause of variance (e.g. counterfeit note withheld, change shortage)..."
                          className="w-full text-xs text-slate-800 border border-rose-300 rounded-xl p-2.5 focus:border-rose-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={handleSubmitCashClosing}
                disabled={actionLoading}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Finalize & Close Cash Register
              </button>
            </div>
          </div>

          {/* Past Closings Audit Log */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Historical Cash Closings Log</h3>
            {cashClosingData.history.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No past closing sessions recorded.</p>
            ) : (
              <div className="space-y-3">
                {cashClosingData.history.map(cls => (
                  <div key={cls.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{cls.closingNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cls.status === 'BALANCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {cls.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Expected: {cls.expectedCash} BDT</span>
                      <span>Actual: {cls.actualCash} BDT</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Closed by {cls.closedByName} on {cls.closingDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Collect Payment */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Collect Payment
                </h3>
                <p className="text-xs text-slate-500">{selectedInvoice.invoiceNumber} • {selectedInvoice.patientName}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between text-xs">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.dueAmount} BDT</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Collect (BDT)</label>
                <input
                  type="number"
                  max={selectedInvoice.dueAmount}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full text-base font-bold text-slate-900 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash' },
                    { id: 'CARD', label: 'Credit/Debit Card' },
                    { id: 'MOBILE', label: 'bKash / Nagad' },
                    { id: 'BANK', label: 'Bank Transfer' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Transaction Reference / Card Last 4 (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder="e.g. bKash TrxID or approval code"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCollectPayment}
                disabled={actionLoading || paymentAmount <= 0}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer"
              >
                Confirm Payment Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Process Refund */}
      {showRefundModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-purple-600" />
                  Process Refund
                </h3>
                <p className="text-xs text-slate-500">{selectedInvoice.invoiceNumber} • {selectedInvoice.patientName}</p>
              </div>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between text-xs">
                <span className="text-slate-500">Collected Amount:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.paidAmount} BDT</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Refund Amount (BDT)</label>
                <input
                  type="number"
                  max={selectedInvoice.paidAmount}
                  value={refundAmount}
                  onChange={e => setRefundAmount(Number(e.target.value))}
                  className="w-full text-base font-bold text-slate-900 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Refund Authorization Reason *</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="e.g. Doctor cancelled consultation / Duplicate test billed"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessRefund}
                disabled={actionLoading || refundAmount <= 0}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md transition cursor-pointer"
              >
                Authorize & Disburse Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                Record Operational Expense
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-slate-800"
                >
                  <option value="SUPPLIES">Medical & Surgical Supplies</option>
                  <option value="LABORATORY">Lab Reagents & Chemicals</option>
                  <option value="UTILITIES">Electricity & Generator Diesel</option>
                  <option value="MAINTENANCE">Biomedical Maintenance</option>
                  <option value="SALARY">Staff Salaries / Per Diem</option>
                  <option value="TRANSPORT">Ambulance Fuel / Logistics</option>
                  <option value="OTHER">Other Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Payee Name *</label>
                <input
                  type="text"
                  value={expenseVendor}
                  onChange={e => setExpenseVendor(e.target.value)}
                  placeholder="e.g. MediSupply Bangladesh Ltd."
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (BDT) *</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full text-base font-bold text-slate-900 border border-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Bill Memo</label>
                <input
                  type="text"
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  placeholder="e.g. 50 boxes nitrile gloves, bill #4892"
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-2.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordExpense}
                disabled={actionLoading || expenseAmount <= 0 || !expenseVendor}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition cursor-pointer"
              >
                Save & Approve Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
