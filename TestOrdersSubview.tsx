import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  FileText,
  User,
  X,
  Stethoscope
} from 'lucide-react';
import { api } from '../../../services/api';
import { TestOrder, DiagnosticTest, Patient, Doctor } from '../../../types';

export const TestOrdersSubview: React.FC = () => {
  const [orders, setOrders] = useState<TestOrder[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New Order Modal
  const [isOpen, setIsOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    patientId: '',
    doctorId: '',
    testIds: [] as string[],
    priority: 'NORMAL' as const,
    notes: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordList, tstList, ptList, docList] = await Promise.all([
        api.reception.getTestOrders(),
        api.getDiagnosticTests(),
        api.reception.getPatients(),
        api.getDoctors()
      ]);
      setOrders(ordList);
      setTests(tstList);
      setPatients(ptList);
      setDoctors(docList);
    } catch (err) {
      console.error('Failed to load test orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestToggle = (id: string) => {
    setOrderForm(prev => ({
      ...prev,
      testIds: prev.testIds.includes(id)
        ? prev.testIds.filter(t => t !== id)
        : [...prev.testIds, id]
    }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.patientId || orderForm.testIds.length === 0) {
      alert('Select patient and at least one diagnostic test');
      return;
    }

    try {
      await api.reception.createTestOrder({
        patientId: orderForm.patientId,
        doctorId: orderForm.doctorId || undefined,
        testIds: orderForm.testIds,
        priority: orderForm.priority,
        notes: orderForm.notes
      });
      setIsOpen(false);
      setOrderForm({ patientId: '', doctorId: '', testIds: [], priority: 'NORMAL', notes: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create test order');
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await api.reception.updateTestOrderStatus(orderId, status);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const selectedTestsPrice = tests
    .filter(t => orderForm.testIds.includes(t.id))
    .reduce((sum, t) => sum + t.price, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Diagnostic Test Bookings & Orders</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pathology, biochemistry, hematology, and radiology test order management.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Prescribe / Order Tests
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Active Lab Orders</h3>
          </div>
          <span className="text-xs text-slate-400">{orders.length} orders</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-xs">No diagnostic test orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Tests Ordered</th>
                  <th className="px-5 py-3">Total (৳)</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-teal-700">{ord.orderNumber}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(ord.orderedAt || ord.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{ord.patientName}</div>
                      <div className="text-slate-500 text-[11px]">{ord.patientPhone}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {ord.items?.map((it, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium">
                            {it.testName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">৳{ord.totalAmount}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          ord.status === 'VERIFIED' || ord.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : ord.status === 'IN_LAB'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <select
                        value={ord.status}
                        onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded text-[11px] font-semibold bg-white"
                      >
                        <option value="SAMPLE_PENDING">Sample Pending</option>
                        <option value="COLLECTED">Collected</option>
                        <option value="IN_LAB">In Lab</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="DELIVERED">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Prescribe Diagnostic Tests</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 pt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient *</label>
                <select
                  required
                  value={orderForm.patientId}
                  onChange={(e) => setOrderForm({ ...orderForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.fullName} ({p.patientId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prescribing Doctor (Optional)</label>
                <select
                  value={orderForm.doctorId}
                  onChange={(e) => setOrderForm({ ...orderForm, doctorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="">-- Direct Patient Self-Walk-In --</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.fullName} ({d.specialty})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Select Tests to Perform *</label>
                  <span className="font-bold text-teal-700">Estimated Total: ৳{selectedTestsPrice}</span>
                </div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 p-1">
                  {tests.map(t => (
                    <label
                      key={t.id}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer rounded"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={orderForm.testIds.includes(t.id)}
                          onChange={() => handleTestToggle(t.id)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-slate-800 font-medium">{t.name}</span>
                      </div>
                      <span className="font-bold text-slate-700">৳{t.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Generate Test Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
