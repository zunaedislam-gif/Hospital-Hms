/**
 * Pattern HMS - Billing, Financial Invoicing, Taxes & Payment Gateways View
 */
import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CreditCard,
  Percent,
  FolderKanban,
  FileText,
  DollarSign,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Eye,
  Building2,
  ShieldCheck,
  Save
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { InvoiceSetting, PaymentMethod, TaxRate, FinancialCategory } from '../types';

export const BillingView: React.FC = () => {
  const { organizations } = useAuth();
  const [activeTab, setActiveTab] = useState<'settings' | 'methods' | 'taxes' | 'categories' | 'invoices'>('settings');
  const [settings, setSettings] = useState<InvoiceSetting | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Modals
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);

  // Forms
  const [methodForm, setMethodForm] = useState({
    name: '',
    code: '',
    type: 'CASH' as const,
    requiresReferenceNumber: false,
    processingFeePercent: 0,
    status: 'ACTIVE' as const
  });

  const [taxForm, setTaxForm] = useState({
    name: '',
    code: '',
    ratePercent: 5,
    description: '',
    status: 'ACTIVE' as const
  });

  const loadData = async () => {
    try {
      const [s, m, t, c, inv] = await Promise.all([
        api.getInvoiceSettings(),
        api.getPaymentMethods(),
        api.getTaxRates(),
        api.getFinancialCategories(),
        api.getInvoices()
      ]);
      setSettings(s);
      setMethods(m);
      setTaxRates(t);
      setCategories(c);
      setInvoices(inv);
    } catch (e) {
      console.error('Failed to load billing config', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveInvoiceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateInvoiceSettings(settings);
      alert('Invoice configuration saved.');
    } catch (e: any) {
      alert(e.message || 'Error saving invoice settings');
    }
  };

  const handleCreateMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPaymentMethod(methodForm);
      await loadData();
      setIsMethodModalOpen(false);
      setMethodForm({
        name: '',
        code: '',
        type: 'CASH',
        requiresReferenceNumber: false,
        processingFeePercent: 0,
        status: 'ACTIVE'
      });
    } catch (e: any) {
      alert(e.message || 'Error creating payment method');
    }
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTaxRate(taxForm);
      await loadData();
      setIsTaxModalOpen(false);
      setTaxForm({
        name: '',
        code: '',
        ratePercent: 5,
        description: '',
        status: 'ACTIVE'
      });
    } catch (e: any) {
      alert(e.message || 'Error creating tax rate');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Billing, Invoices & Financial Configuration</h1>
          <p className="text-xs text-slate-500">
            Invoice numbering sequences, payment gateways, municipal tax rates, and ledger categories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'settings' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Invoice Config
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ledger Invoices
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'methods' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payment Methods
            </button>
            <button
              onClick={() => setActiveTab('taxes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'taxes' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tax Rates
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Revenue Categories
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INVOICE SETTINGS */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveInvoiceSettings} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-6 max-w-2xl">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900">Hospital Invoicing Standard Policy</h2>
            <p className="text-xs text-slate-500">Numbering sequence, due days, terms, and tax print preferences</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Prefix *</label>
              <input
                type="text"
                required
                value={settings.invoicePrefix}
                onChange={e => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number Sequence Padding</label>
              <input
                type="number"
                value={settings.invoiceNumberPadding}
                onChange={e => setSettings({ ...settings, invoiceNumberPadding: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Next Number Sequence</label>
              <input
                type="number"
                value={settings.nextInvoiceNumber}
                onChange={e => setSettings({ ...settings, nextInvoiceNumber: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Due Days</label>
              <input
                type="number"
                value={settings.defaultPaymentDueDays}
                onChange={e => setSettings({ ...settings, defaultPaymentDueDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Terms & Disclaimer</label>
            <textarea
              rows={2}
              value={settings.termsAndConditions}
              onChange={e => setSettings({ ...settings, termsAndConditions: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt Footer Note</label>
            <input
              type="text"
              value={settings.footerNote}
              onChange={e => setSettings({ ...settings, footerNote: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={settings.enableTaxCalculation}
                onChange={e => setSettings({ ...settings, enableTaxCalculation: e.target.checked })}
                className="rounded text-teal-600 border-slate-300 focus:ring-teal-500"
              />
              <span>Enable automated municipal/national tax calculations on bills</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={settings.showTaxBreakdownOnReceipt}
                onChange={e => setSettings({ ...settings, showTaxBreakdownOnReceipt: e.target.checked })}
                className="rounded text-teal-600 border-slate-300 focus:ring-teal-500"
              />
              <span>Display itemized VAT/Tax breakdown on patient thermal receipt</span>
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-xs"
            >
              <Save className="w-4 h-4" />
              Save Invoice Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: INVOICES LIST */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Tax & Discount</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{inv.invoiceNumber}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{inv.patientName}</td>
                  <td className="py-3.5 px-4 text-slate-600">${inv.subtotal}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    +${inv.taxAmount} Tax • -${inv.discountAmount} Disc
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">${inv.totalAmount}</td>
                  <td className="py-3.5 px-4">
                    {inv.status === 'PAID' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Paid Full
                      </span>
                    )}
                    {inv.status === 'PARTIAL' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Partial
                      </span>
                    )}
                    {inv.status === 'DUE' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Payment Due
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md transition"
                    >
                      <Eye className="w-3 h-3" /> View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PAYMENT METHODS */}
      {activeTab === 'methods' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsMethodModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {methods.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{m.name}</h4>
                      <span className="font-mono text-[10px] text-slate-400">{m.code}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    {m.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
                  <div>Type: <span className="font-semibold text-slate-800">{m.type}</span></div>
                  <div>Fee: <span className="font-semibold text-slate-800">{m.processingFeePercent}%</span></div>
                  <div>Requires Ref/Txn ID: <span className="font-semibold text-slate-800">{m.requiresReferenceNumber ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TAX RATES */}
      {activeTab === 'taxes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsTaxModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Tax Rate
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tax / Levy Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Percentage Rate</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxRates.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{t.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">{t.code}</td>
                    <td className="py-3.5 px-4 font-bold text-teal-700 text-sm">{t.ratePercent}%</td>
                    <td className="py-3.5 px-4 text-slate-500">{t.description}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCIAL REVENUE CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-600 font-bold">{c.code}</span>
              </div>
              <p className="text-xs text-slate-500">{c.description}</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-teal-700 font-semibold flex items-center justify-between">
                <span>Account Code: {c.code}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Receipt Preview */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-xs">Official Hospital Cash Receipt</span>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-4 font-mono text-xs text-slate-800">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <div className="font-bold text-sm text-slate-900">PATTERN HEALTHCARE SYSTEMS</div>
                <div className="text-[10px] text-slate-500">Central Medical Center • New York</div>
                <div className="text-[10px] text-slate-500">Tax ID: REG-NY-90284</div>
              </div>

              <div className="flex justify-between text-[11px]">
                <span>Invoice: {selectedInvoice.invoiceNumber}</span>
                <span>{selectedInvoice.createdAt}</span>
              </div>
              <div className="text-[11px]">
                Patient: <span className="font-bold">{selectedInvoice.patientName}</span>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                {selectedInvoice.items?.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>{it.description} x{it.quantity}</span>
                    <span>${it.total}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right text-[11px]">
                <div>Subtotal: ${selectedInvoice.subtotal}</div>
                <div>VAT / Tax: +${selectedInvoice.taxAmount}</div>
                <div>Discount: -${selectedInvoice.discountAmount}</div>
                <div className="text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  Total Paid: ${selectedInvoice.totalAmount}
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-400">
                Thank you for choosing Pattern HMS. Get well soon!
              </div>

              <button
                onClick={() => alert('Receipt sent to thermal POS printer.')}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-sans font-semibold rounded-lg text-xs transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print Thermal Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Payment Method */}
      {isMethodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Payment Method</h3>
            <form onSubmit={handleCreateMethod} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Method Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple Pay / NFC"
                  value={methodForm.name}
                  onChange={e => setMethodForm({ ...methodForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APPLE_PAY"
                  value={methodForm.code}
                  onChange={e => setMethodForm({ ...methodForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={methodForm.type}
                  onChange={e => setMethodForm({ ...methodForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="MOBILE_BANKING">Mobile Banking</option>
                  <option value="INSURANCE">Insurance Claim</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMethodModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                >
                  Save Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Tax Rate */}
      {isTaxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Tax Rate</h3>
            <form onSubmit={handleCreateTax} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Healthcare Surcharge"
                  value={taxForm.name}
                  onChange={e => setTaxForm({ ...taxForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SURCHARGE_2"
                    value={taxForm.code}
                    onChange={e => setTaxForm({ ...taxForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate Percent (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={taxForm.ratePercent}
                    onChange={e => setTaxForm({ ...taxForm, ratePercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaxModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                >
                  Save Tax Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
