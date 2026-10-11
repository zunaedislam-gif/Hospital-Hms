import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  DollarSign,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  FileText
} from 'lucide-react';
import { api } from '../../../services/api';
import {
  Invoice,
  Patient,
  SalesAgent,
  DiagnosticTest,
  Doctor,
  PaymentMethod
} from '../../../types';

interface BillingSubviewProps {
  initialPatient?: Patient | null;
  onClearInitialPatient?: () => void;
}

export const BillingSubview: React.FC<BillingSubviewProps> = ({
  initialPatient,
  onClearInitialPatient
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // New Invoice Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Selected invoice for receipt printing
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);

  // Collect Payment Modal
  const [collectingInvoice, setCollectingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentRef, setPaymentRef] = useState('');

  // Invoice builder state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [billItems, setBillItems] = useState<
    { serviceType: string; itemId: string; description: string; quantity: number; unitPrice: number }[]
  >([
    { serviceType: 'CONSULTATION', itemId: 'doc-1', description: 'General Consultation', quantity: 1, unitPrice: 800 }
  ]);
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [initialPayAmount, setInitialPayAmount] = useState<number>(0);
  const [initialPayMethod, setInitialPayMethod] = useState<PaymentMethod>('CASH');

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await api.reception.getInvoices({
        query: searchQuery || undefined,
        status: statusFilter || undefined
      });
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [pts, agents, tsts, docs] = await Promise.all([
        api.reception.getPatients(),
        api.reception.getSalesAgents({ status: 'ACTIVE' }),
        api.getDiagnosticTests(),
        api.getDoctors()
      ]);
      setPatients(pts);
      setSalesAgents(agents);
      setTests(tsts);
      setDoctors(docs);
    } catch (err) {
      console.error('Failed to load metadata', err);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    if (initialPatient) {
      setSelectedPatientId(initialPatient.id);
      setIsCreateOpen(true);
    }
  }, [initialPatient]);

  const handleAddItem = (type: string) => {
    if (type === 'TEST' && tests.length > 0) {
      const t = tests[0];
      setBillItems(prev => [
        ...prev,
        { serviceType: 'DIAGNOSTIC_TEST', itemId: t.id, description: t.name, quantity: 1, unitPrice: t.price }
      ]);
    } else if (type === 'DOCTOR' && doctors.length > 0) {
      const d = doctors[0];
      setBillItems(prev => [
        ...prev,
        { serviceType: 'CONSULTATION', itemId: d.id, description: `Consultation - ${d.fullName}`, quantity: 1, unitPrice: d.consultationFee }
      ]);
    } else {
      setBillItems(prev => [
        ...prev,
        { serviceType: 'PROCEDURE', itemId: 'item-' + Date.now(), description: 'Hospital Dressing / Service', quantity: 1, unitPrice: 350 }
      ]);
    }
  };

  const handleRemoveItem = (idx: number) => {
    setBillItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || billItems.length === 0) {
      alert('Select a patient and add at least one item');
      return;
    }

    try {
      const res = await api.reception.createInvoice({
        patientId: selectedPatientId,
        salesAgentId: selectedAgentId || undefined,
        items: billItems,
        discountType,
        discountValue: Number(discountVal),
        initialPayment: initialPayAmount > 0 ? {
          amount: Number(initialPayAmount),
          method: initialPayMethod,
          transactionReference: 'INIT-' + Date.now()
        } : undefined
      });

      setIsCreateOpen(false);
      if (onClearInitialPatient) onClearInitialPatient();
      setReceiptInvoice(res.invoice);
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    }
  };

  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingInvoice || paymentAmount <= 0) {
      alert('Please specify a valid payment amount');
      return;
    }

    try {
      await api.reception.createPayment({
        invoiceId: collectingInvoice.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
        transactionReference: paymentRef || 'REC-' + Date.now()
      });
      const updatedInv = await api.reception.getInvoiceById(collectingInvoice.id);
      setCollectingInvoice(null);
      setReceiptInvoice(updatedInv);
      loadInvoices();
    } catch (err: any) {
      alert(err.message || 'Payment collection failed');
    }
  };

  // Calculations for new invoice preview
  const subtotal = billItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = discountType === 'PERCENT' ? (subtotal * (discountVal / 100)) : discountVal;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * 0.05); // 5% VAT
  const netPayable = taxableAmount + taxAmount;

  return (
    <div className="space-y-6">
      {/* Top Search & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice # (e.g. INV-2026-000101) or Patient Name"
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <button
          onClick={() => {
            setInitialPayAmount(0);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Invoice
        </button>
      </div>

      {/* Invoice Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Invoices & Billing History</h3>
          </div>
          <span className="text-xs text-slate-400">{invoices.length} records</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading billing data...</div>
        ) : invoices.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-xs">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Invoice # & Date</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Sales Agent</th>
                  <th className="px-5 py-3">Total Payable</th>
                  <th className="px-5 py-3">Paid / Due</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(inv.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{inv.patientName}</div>
                      <div className="text-slate-500 text-[11px]">{inv.patientPhone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.salesAgentName ? (
                        <div>
                          <div className="font-medium text-slate-800">{inv.salesAgentName}</div>
                          <span className="text-[10px] text-teal-600">
                            ৳{inv.salesAgentCommissionEarned || 0} ({inv.salesAgentCommissionRate}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Direct Walk-In</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">৳{inv.netPayable}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-emerald-600 font-semibold">৳{inv.paidAmount} Paid</div>
                      {inv.dueAmount > 0 ? (
                        <div className="text-rose-600 font-bold">৳{inv.dueAmount} Due</div>
                      ) : (
                        <div className="text-slate-400 text-[10px]">Settled</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : inv.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.dueAmount > 0 && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => {
                              setCollectingInvoice(inv);
                              setPaymentAmount(inv.dueAmount);
                            }}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md text-[11px] shadow-2xs"
                          >
                            Collect
                          </button>
                        )}
                        <button
                          onClick={() => setReceiptInvoice(inv)}
                          title="Print Receipt"
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
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

      {/* Create New Invoice Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create Patient Invoice</h3>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  if (onClearInitialPatient) onClearInitialPatient();
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient *</label>
                  <select
                    required
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.fullName} ({p.patientId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Referring Sales Agent (Optional)</label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">-- No Agent (Direct) --</option>
                    {salesAgents.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.fullName} ({a.commissionPercentage}% Commission)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Billable Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800">Billable Services & Tests</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddItem('TEST')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
                    >
                      + Add Test
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('DOCTOR')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
                    >
                      + Add Doctor Fee
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddItem('OTHER')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium"
                    >
                      + Add Service
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Item / Service</th>
                        <th className="px-3 py-2 w-20">Qty</th>
                        <th className="px-3 py-2 w-24">Price (৳)</th>
                        <th className="px-3 py-2 w-24 text-right">Subtotal</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {billItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBillItems(prev => prev.map((it, i) => i === idx ? { ...it, description: val } : it));
                              }}
                              className="w-full px-2 py-1 border border-slate-200 rounded"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 1;
                                setBillItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                              }}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-center"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setBillItems(prev => prev.map((it, i) => i === idx ? { ...it, unitPrice: val } : it));
                              }}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-right"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-semibold">
                            ৳{item.quantity * item.unitPrice}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discount & Calculations */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-semibold text-slate-800">৳{subtotal}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Discount:</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as any)}
                      className="px-2 py-1 border border-slate-300 rounded bg-white"
                    >
                      <option value="FIXED">Fixed (৳)</option>
                      <option value="PERCENT">Percent (%)</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={discountVal}
                      onChange={(e) => setDiscountVal(Number(e.target.value) || 0)}
                      className="w-24 px-2 py-1 border border-slate-300 rounded text-right bg-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">VAT / Tax (5%):</span>
                  <span className="font-medium text-slate-700">৳{taxAmount}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                  <span>Net Payable:</span>
                  <span className="text-teal-700">৳{netPayable}</span>
                </div>
              </div>

              {/* Initial Payment Collection */}
              <div className="border border-slate-200 p-3 rounded-xl">
                <span className="font-bold text-slate-800 block mb-2">Collect Initial Payment</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Amount to Collect (৳)</label>
                    <input
                      type="number"
                      min="0"
                      max={netPayable}
                      value={initialPayAmount}
                      onChange={(e) => setInitialPayAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Payment Method</label>
                    <select
                      value={initialPayMethod}
                      onChange={(e) => setInitialPayMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="CASH">Cash (Cash Register)</option>
                      <option value="MOBILE_BANKING">Mobile Banking (bKash/Nagad)</option>
                      <option value="CARD">Credit/Debit Card (POS)</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Confirm & Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {collectingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Collect Outstanding Due</h3>
              <button
                onClick={() => setCollectingInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectPaymentSubmit} className="space-y-4 pt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-mono font-bold">{collectingInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-semibold">{collectingInvoice.patientName}</span>
                </div>
                <div className="flex justify-between mt-1 text-rose-600 font-bold">
                  <span>Current Due:</span>
                  <span>৳{collectingInvoice.dueAmount}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  max={collectingInvoice.dueAmount}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="CASH">Cash</option>
                  <option value="MOBILE_BANKING">Mobile Banking (bKash/Nagad)</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / Note</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. TXN-948210 or Cash counter"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingInvoice(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Record Payment & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Dialog */}
      {receiptInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-base">Official Payment Receipt</h3>
              </div>
              <button
                onClick={() => setReceiptInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 font-mono">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h4 className="font-bold text-sm text-slate-900">PATTERN HOSPITAL & DIAGNOSTICS</h4>
                <p className="text-[10px] text-slate-500">Dhanmondi, Dhaka-1205 • Tel: +880 2 9876543</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  INVOICE: {receiptInvoice.invoiceNumber}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Patient: <strong>{receiptInvoice.patientName}</strong></div>
                <div className="text-right">Phone: {receiptInvoice.patientPhone}</div>
                <div>Cashier: {receiptInvoice.receptionistName}</div>
                <div className="text-right">
                  Date: {new Date(receiptInvoice.createdAt).toLocaleString('en-GB')}
                </div>
              </div>

              <div className="border-t border-b border-slate-200 py-2">
                {receiptInvoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-0.5 text-[11px]">
                    <span>{item.description} (x{item.quantity})</span>
                    <span className="font-semibold">৳{item.total}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>৳{receiptInvoice.subtotal}</span>
                </div>
                {receiptInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-৳{receiptInvoice.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT (5%):</span>
                  <span>৳{receiptInvoice.taxAmount}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-xs pt-1 border-t border-slate-300">
                  <span>Net Total:</span>
                  <span>৳{receiptInvoice.netPayable}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Paid:</span>
                  <span>৳{receiptInvoice.paidAmount}</span>
                </div>
                {receiptInvoice.dueAmount > 0 && (
                  <div className="flex justify-between font-bold text-rose-700">
                    <span>Outstanding Due:</span>
                    <span>৳{receiptInvoice.dueAmount}</span>
                  </div>
                )}
              </div>

              {receiptInvoice.salesAgentName && (
                <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100">
                  Referred by Agent: {receiptInvoice.salesAgentName}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setReceiptInvoice(null)}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
