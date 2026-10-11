import React, { useState, useEffect } from 'react';
import {
  Clock,
  Banknote,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Printer,
  X
} from 'lucide-react';
import { api } from '../../../services/api';
import { ReceptionistShift } from '../../../types';

export const ShiftsSubview: React.FC = () => {
  const [currentShift, setCurrentShift] = useState<ReceptionistShift | null>(null);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Start shift modal
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState<number>(2000);

  // Close shift modal
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [actualCash, setActualCash] = useState<number>(0);
  const [discrepancyReason, setDiscrepancyReason] = useState('');

  const loadShiftData = async () => {
    setIsLoading(true);
    try {
      const [shift, summary] = await Promise.all([
        api.reception.getCurrentShift(),
        api.reception.getDailyCollection()
      ]);
      setCurrentShift(shift);
      setDailySummary(summary);
      if (shift) {
        setActualCash(shift.expectedCash || 0);
      }
    } catch (err) {
      console.error('Failed to load shift data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShiftData();
  }, []);

  const handleStartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const s = await api.reception.startShift(Number(openingCash));
      setCurrentShift(s);
      setIsStartOpen(false);
      loadShiftData();
    } catch (err: any) {
      alert(err.message || 'Failed to start shift');
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;

    try {
      await api.reception.closeShift(
        currentShift.id,
        Number(actualCash),
        discrepancyReason
      );
      setIsCloseOpen(false);
      alert('Shift successfully closed and settled!');
      loadShiftData();
    } catch (err: any) {
      alert(err.message || 'Failed to close shift');
    }
  };

  const discrepancy = currentShift ? Number(actualCash) - currentShift.expectedCash : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Active Register Status */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-base">Front-Desk Cash Register & Shifts</h3>
            {currentShift ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Shift Open
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Register Closed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cash drawer balance control, end-of-day reconciliation, and discrepancy auditing.
          </p>
        </div>

        <div>
          {currentShift ? (
            <button
              onClick={() => {
                setActualCash(currentShift.expectedCash);
                setIsCloseOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Lock className="w-4 h-4" /> Close & Settle Shift
            </button>
          ) : (
            <button
              onClick={() => setIsStartOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <Unlock className="w-4 h-4" /> Open Register Shift
            </button>
          )}
        </div>
      </div>

      {/* Current Active Shift Cards */}
      {currentShift && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 block font-semibold">Opening Float</span>
            <span className="text-xl font-bold text-slate-800">৳{currentShift.openingCash}</span>
            <span className="text-[10px] text-slate-400 block mt-1">
              Started: {new Date(currentShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-emerald-600 block font-semibold">Cash Collected</span>
            <span className="text-xl font-bold text-emerald-700">৳{currentShift.totalCashReceived}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Direct Drawer Cash</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-blue-600 block font-semibold">Digital & POS</span>
            <span className="text-xl font-bold text-blue-700">
              ৳{currentShift.totalCardReceived + currentShift.totalMobileReceived + currentShift.totalBankReceived}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Card / bKash / Bank</span>
          </div>

          <div className="bg-teal-500/10 p-4 rounded-xl border border-teal-200 shadow-2xs">
            <span className="text-xs text-teal-800 block font-semibold">Expected Cash in Drawer</span>
            <span className="text-xl font-bold text-teal-900">৳{currentShift.expectedCash}</span>
            <span className="text-[10px] text-teal-700 block mt-1">Opening Float + Cash Receipts</span>
          </div>
        </div>
      )}

      {/* Daily Collection Summary Breakdown */}
      {dailySummary && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900 text-sm">Today&apos;s Revenue Breakdown</h3>
            <span className="text-xs font-mono font-bold text-teal-700">
              Total: ৳{dailySummary.totalCollected || 0}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Banknote className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-500 block">Cash Counter</span>
                <span className="font-bold text-sm text-slate-800">৳{dailySummary.byMethod?.CASH || 0}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-pink-600 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-500 block">Mobile Banking (bKash/Nagad)</span>
                <span className="font-bold text-sm text-slate-800">৳{dailySummary.byMethod?.MOBILE_BANKING || 0}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-600 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-500 block">Card (POS Terminal)</span>
                <span className="font-bold text-sm text-slate-800">৳{dailySummary.byMethod?.CARD || 0}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
              <Building className="w-8 h-8 text-purple-600 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-500 block">Bank Transfer</span>
                <span className="font-bold text-sm text-slate-800">৳{dailySummary.byMethod?.BANK_TRANSFER || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Shift Modal */}
      {isStartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Open Register Shift</h3>
              <button onClick={() => setIsStartOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Opening Float Cash (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-teal-700 text-base"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Amount of petty cash in the register drawer at start of shift.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStartOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs"
                >
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseOpen && currentShift && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Close Cash Register</h3>
              <button onClick={() => setIsCloseOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCloseSubmit} className="space-y-4 pt-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Opening Cash:</span>
                  <span className="font-semibold">৳{currentShift.openingCash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cash Received:</span>
                  <span className="font-semibold text-emerald-600">+৳{currentShift.totalCashReceived}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                  <span>System Expected Cash:</span>
                  <span className="text-teal-700">৳{currentShift.expectedCash}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Actual Cash Counted in Drawer (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 text-base"
                />
              </div>

              {discrepancy !== 0 && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    discrepancy < 0
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">
                      Discrepancy: {discrepancy < 0 ? `Short by ৳${Math.abs(discrepancy)}` : `Over by ৳${discrepancy}`}
                    </span>
                    <p className="text-[10px] mt-0.5">Please provide an explanatory remark below.</p>
                  </div>
                </div>
              )}

              {discrepancy !== 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discrepancy Explanation *</label>
                  <input
                    type="text"
                    required
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    placeholder="e.g. Returned ৳20 change miscalculated or unrecorded petty cash"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCloseOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Register Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
