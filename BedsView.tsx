/**
 * Pattern HMS - Bed, Ward & Room Management View
 */
import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Wrench,
  Layers,
  Building2,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bed, Ward, Room } from '../types';

export const BedsView: React.FC = () => {
  const { organizations, branches } = useAuth();
  const [activeTab, setActiveTab] = useState<'beds' | 'wards' | 'rooms'>('beds');
  const [beds, setBeds] = useState<Bed[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals
  const [isBedModalOpen, setIsBedModalOpen] = useState(false);
  const [isWardModalOpen, setIsWardModalOpen] = useState(false);
  const [targetBed, setTargetBed] = useState<Bed | null>(null);

  // Forms
  const [bedForm, setBedForm] = useState({
    bedNumber: '',
    wardId: '',
    roomId: '',
    dailyRate: 120,
    features: ['Oxygen Support', 'Cardiac Monitor']
  });

  const [wardForm, setWardForm] = useState({
    name: '',
    code: '',
    type: 'GENERAL' as const,
    branchId: branches[0]?.id || '',
    genderRestriction: 'ANY' as const,
    dailyBaseRate: 80
  });

  const loadData = async () => {
    try {
      const [b, w, r] = await Promise.all([
        api.getBeds(),
        api.getWards(),
        api.getRooms()
      ]);
      setBeds(b);
      setWards(w);
      setRooms(r);
      if (w.length > 0 && !bedForm.wardId) {
        setBedForm(prev => ({ ...prev, wardId: w[0].id }));
      }
    } catch (e) {
      console.error('Failed to load beds', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBed(bedForm);
      await loadData();
      setIsBedModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error creating bed');
    }
  };

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createWard(wardForm);
      await loadData();
      setIsWardModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error creating ward');
    }
  };

  const handleQuickStatusChange = async (bed: Bed, newStatus: any) => {
    try {
      await api.updateBedStatus(bed.id, newStatus);
      await loadData();
      setTargetBed(null);
    } catch (e: any) {
      alert(e.message || 'Failed to update bed status');
    }
  };

  const filteredBeds = beds.filter(b => {
    if (selectedWardFilter !== 'ALL' && b.wardId !== selectedWardFilter) return false;
    if (selectedStatusFilter !== 'ALL' && b.status !== selectedStatusFilter) return false;
    return true;
  });

  const getBedColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 border-emerald-300 text-emerald-800';
      case 'OCCUPIED':
        return 'bg-rose-50 border-rose-300 text-rose-800';
      case 'CLEANING':
        return 'bg-sky-50 border-sky-300 text-sky-800';
      case 'MAINTENANCE':
        return 'bg-amber-50 border-amber-300 text-amber-800';
      default:
        return 'bg-slate-50 border-slate-300 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Bed Capacity & Ward Infrastructure</h1>
          <p className="text-xs text-slate-500">
            Inpatient admissions, ICU monitoring, room allocations, and bed sanitization status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('beds')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'beds' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Beds Visual Grid
            </button>
            <button
              onClick={() => setActiveTab('wards')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'wards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Wards List
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'rooms' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rooms
            </button>
          </div>

          {activeTab === 'beds' && (
            <button
              onClick={() => setIsBedModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Bed
            </button>
          )}
          {activeTab === 'wards' && (
            <button
              onClick={() => setIsWardModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Ward
            </button>
          )}
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Beds</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{beds.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700">Available</span>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">
            {beds.filter(b => b.status === 'AVAILABLE').length}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-700">Occupied</span>
          <div className="text-xl font-bold text-rose-700 mt-0.5">
            {beds.filter(b => b.status === 'OCCUPIED').length}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-sky-700">Cleaning</span>
          <div className="text-xl font-bold text-sky-700 mt-0.5">
            {beds.filter(b => b.status === 'CLEANING').length}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-center shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-700">Maintenance</span>
          <div className="text-xl font-bold text-amber-700 mt-0.5">
            {beds.filter(b => b.status === 'MAINTENANCE').length}
          </div>
        </div>
      </div>

      {/* TAB 1: BEDS VISUAL GRID */}
      {activeTab === 'beds' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-xs font-semibold text-slate-600">
              Interactive Bed Layout (Click any bed to modify clinical status)
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedWardFilter}
                onChange={e => setSelectedWardFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
              >
                <option value="ALL">All Wards</option>
                {wards.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBeds.map(bed => (
              <div
                key={bed.id}
                onClick={() => setTargetBed(bed)}
                className={`p-4 rounded-xl border-2 shadow-2xs transition cursor-pointer hover:scale-[1.02] flex flex-col justify-between ${getBedColor(bed.status)}`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-base font-black tracking-tight">{bed.bedNumber}</span>
                      <div className="text-xs font-semibold opacity-90">{bed.wardName}</div>
                    </div>
                    <BedDouble className="w-5 h-5 opacity-80" />
                  </div>

                  <div className="mt-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="opacity-75">Status:</span>
                      <span className="font-bold">{bed.status}</span>
                    </div>
                    {bed.currentPatientName && (
                      <div className="flex items-center justify-between pt-1 border-t border-current/10">
                        <span className="opacity-75">Patient:</span>
                        <span className="font-bold truncate max-w-[120px]">{bed.currentPatientName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] opacity-75">
                      <span>Tariff:</span>
                      <span>${bed.dailyRate}/night</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-current/10 text-[10px] font-bold text-center uppercase tracking-wider">
                  Click to Change Status
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: WARDS LIST */}
      {activeTab === 'wards' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ward Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Ward Type</th>
                <th className="py-3 px-4">Total Beds</th>
                <th className="py-3 px-4">Occupancy Rate</th>
                <th className="py-3 px-4">Daily Base Tariff</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wards.map(ward => {
                const wardBeds = beds.filter(b => b.wardId === ward.id);
                const occupiedCount = wardBeds.filter(b => b.status === 'OCCUPIED').length;
                const pct = wardBeds.length > 0 ? Math.round((occupiedCount / wardBeds.length) * 100) : 0;
                return (
                  <tr key={ward.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{ward.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">{ward.code}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {ward.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{wardBeds.length} Beds</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-teal-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-teal-700">${ward.dailyBaseRate}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ROOMS */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{room.name}</div>
                  <div className="text-[11px] text-slate-500">Room #{room.roomNumber}</div>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                  {room.type}
                </span>
              </div>
              <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
                <div>Capacity: <span className="font-semibold text-slate-800">{room.capacity} Beds</span></div>
                <div>Ward Unit: <span className="font-semibold text-slate-800">{room.wardName}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Quick Bed Status Changer */}
      {targetBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Bed #{targetBed.bedNumber} Status</h3>
              <button onClick={() => setTargetBed(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="text-xs text-slate-500">
              Select new operational condition for Bed <span className="font-bold text-slate-800">{targetBed.bedNumber}</span> in {targetBed.wardName}.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickStatusChange(targetBed, 'AVAILABLE')}
                className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition text-left"
              >
                ✓ Available
                <div className="text-[10px] font-normal text-emerald-600">Ready for admission</div>
              </button>
              <button
                onClick={() => handleQuickStatusChange(targetBed, 'CLEANING')}
                className="p-2.5 rounded-lg border border-sky-300 bg-sky-50 text-sky-800 font-bold text-xs hover:bg-sky-100 transition text-left"
              >
                ⟳ Sanitizing
                <div className="text-[10px] font-normal text-sky-600">Housekeeping cleaning</div>
              </button>
              <button
                onClick={() => handleQuickStatusChange(targetBed, 'OCCUPIED')}
                className="p-2.5 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 transition text-left"
              >
                ● Occupied
                <div className="text-[10px] font-normal text-rose-600">Patient admitted</div>
              </button>
              <button
                onClick={() => handleQuickStatusChange(targetBed, 'MAINTENANCE')}
                className="p-2.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 transition text-left"
              >
                ⚠ Maintenance
                <div className="text-[10px] font-normal text-amber-600">Bio-medical repair</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Bed */}
      {isBedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Register Inpatient Bed</h3>
            <form onSubmit={handleCreateBed} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BED-ICU-05"
                  value={bedForm.bedNumber}
                  onChange={e => setBedForm({ ...bedForm, bedNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Unit *</label>
                <select
                  value={bedForm.wardId}
                  onChange={e => setBedForm({ ...bedForm, wardId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                >
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Tariff ($)</label>
                <input
                  type="number"
                  value={bedForm.dailyRate}
                  onChange={e => setBedForm({ ...bedForm, dailyRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBedModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                >
                  Create Bed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Ward */}
      {isWardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Hospital Ward</h3>
            <form onSubmit={handleCreateWard} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neonatal Intensive Care (NICU)"
                  value={wardForm.name}
                  onChange={e => setWardForm({ ...wardForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NICU-01"
                  value={wardForm.code}
                  onChange={e => setWardForm({ ...wardForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWardModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                >
                  Create Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
