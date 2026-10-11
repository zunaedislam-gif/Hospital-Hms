import React, { useState, useEffect } from 'react';
import {
  Users,
  Percent,
  Plus,
  ArrowDownRight,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  X,
  History
} from 'lucide-react';
import { api } from '../../../services/api';
import { SalesAgent, CommissionLedger } from '../../../types';

export const SalesAgentsSubview: React.FC = () => {
  const [agents, setAgents] = useState<SalesAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<
    (SalesAgent & { ledger: CommissionLedger[] }) | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  // New Agent Modal
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    nidNumber: '',
    commissionPercentage: 40
  });

  // Payout Modal
  const [payoutAgent, setPayoutAgent] = useState<SalesAgent | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutNote, setPayoutNote] = useState('');

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const data = await api.reception.getSalesAgents();
      setAgents(data);
    } catch (err) {
      console.error('Failed to load agents', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentForm.fullName || !agentForm.phone) {
      alert('Name and Phone are required');
      return;
    }

    try {
      await api.reception.createSalesAgent({
        fullName: agentForm.fullName,
        phone: agentForm.phone,
        email: agentForm.email,
        nidNumber: agentForm.nidNumber,
        commissionPercentage: Number(agentForm.commissionPercentage)
      });
      setIsRegisterOpen(false);
      setAgentForm({ fullName: '', phone: '', email: '', nidNumber: '', commissionPercentage: 40 });
      loadAgents();
    } catch (err: any) {
      alert(err.message || 'Failed to register sales agent');
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAgent || payoutAmount <= 0) {
      alert('Valid payout amount required');
      return;
    }
    if (payoutAmount > payoutAgent.outstandingBalance) {
      alert(`Cannot pay more than agent's outstanding balance of ৳${payoutAgent.outstandingBalance}`);
      return;
    }

    try {
      await api.reception.recordCommissionPayout(payoutAgent.id, {
        amount: Number(payoutAmount),
        notes: payoutNote || 'Front-desk cash commission disbursement'
      });
      setPayoutAgent(null);
      setPayoutAmount(0);
      setPayoutNote('');
      loadAgents();
    } catch (err: any) {
      alert(err.message || 'Payout failed');
    }
  };

  const handleViewLedger = async (agent: SalesAgent) => {
    try {
      const details = await api.reception.getSalesAgentById(agent.id);
      setSelectedAgent(details);
    } catch (err) {
      console.error('Failed to load agent ledger', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">Referring Agents & Medical Representatives</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated commission calculations, referral snapshots, and immutable financial ledgers.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Register Sales Agent
        </button>
      </div>

      {/* Agents Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Agent Commission Overview</h3>
          </div>
          <span className="text-xs text-slate-400">{agents.length} active agents</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-xs">No sales agents registered yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Agent Code & Name</th>
                  <th className="px-5 py-3">Contact Details</th>
                  <th className="px-5 py-3">Commission Rate</th>
                  <th className="px-5 py-3">Total Earned</th>
                  <th className="px-5 py-3">Paid Out</th>
                  <th className="px-5 py-3">Balance Payable</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        {agent.agentId}
                      </span>
                      <div className="font-semibold text-slate-900 mt-1">{agent.fullName}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-800 font-medium">{agent.phone}</div>
                      <div className="text-slate-400 text-[10px]">{agent.email || 'No email'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {agent.commissionPercentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">৳{agent.totalEarned}</td>
                    <td className="px-5 py-3.5 text-emerald-600 font-medium">৳{agent.totalPaid}</td>
                    <td className="px-5 py-3.5 font-bold text-amber-700">
                      ৳{agent.outstandingBalance}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {agent.outstandingBalance > 0 && (
                          <button
                            onClick={() => {
                              setPayoutAgent(agent);
                              setPayoutAmount(agent.outstandingBalance);
                            }}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-md text-[11px] shadow-2xs"
                          >
                            Disburse Payout
                          </button>
                        )}
                        <button
                          onClick={() => handleViewLedger(agent)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md text-[11px]"
                        >
                          Ledger
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

      {/* Register Agent Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Register Referring Sales Agent</h3>
              <button onClick={() => setIsRegisterOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={agentForm.fullName}
                  onChange={(e) => setAgentForm({ ...agentForm, fullName: e.target.value })}
                  placeholder="e.g. Dr. K. M. Hossain / Agent Rafiq"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={agentForm.phone}
                  onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
                  placeholder="+8801811223344"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NID Number</label>
                  <input
                    type="text"
                    value={agentForm.nidNumber}
                    onChange={(e) => setAgentForm({ ...agentForm, nidNumber: e.target.value })}
                    placeholder="198547281928"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Commission Rate (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={agentForm.commissionPercentage}
                    onChange={(e) => setAgentForm({ ...agentForm, commissionPercentage: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={agentForm.email}
                  onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                  placeholder="agent@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Register Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disburse Payout Modal */}
      {payoutAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Disburse Commission Payout</h3>
              <button onClick={() => setPayoutAgent(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4 pt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800">{payoutAgent.fullName} ({payoutAgent.agentId})</div>
                <div className="text-amber-700 font-bold mt-1">
                  Outstanding Balance: ৳{payoutAgent.outstandingBalance}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Amount (৳) *</label>
                <input
                  type="number"
                  min="1"
                  max={payoutAgent.outstandingBalance}
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Voucher / Disbursement Note</label>
                <input
                  type="text"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  placeholder="e.g. Cash voucher #4928 front-desk signed"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayoutAgent(null)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Confirm Cash Disbursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger History Drawer */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedAgent.fullName} — Ledger</h3>
                <span className="font-mono text-teal-600 font-bold">{selectedAgent.agentId}</span>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
                <div>
                  <span className="text-slate-400 block text-[10px]">Earned</span>
                  <span className="font-bold text-slate-800">৳{selectedAgent.totalEarned}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Paid</span>
                  <span className="font-bold text-emerald-600">৳{selectedAgent.totalPaid}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Balance</span>
                  <span className="font-bold text-amber-700">৳{selectedAgent.outstandingBalance}</span>
                </div>
              </div>

              <h4 className="font-semibold text-slate-700 pt-2">Transaction Audit Ledger</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedAgent.ledger?.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-500">
                          {new Date(entry.createdAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              entry.entryType === 'EARNED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : entry.entryType === 'PAID'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {entry.entryType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {entry.entryType === 'PAID' ? '-' : '+'}৳{entry.amount}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-800">
                          ৳{entry.balanceAfter}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 rounded-lg"
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
