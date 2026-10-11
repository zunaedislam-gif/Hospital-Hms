/**
 * Pattern HMS - Organizations, Hospitals & Branches Management View
 */
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  ShieldCheck,
  Building,
  Activity,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Organization, Branch } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const OrganizationsView: React.FC = () => {
  const { organizations, refreshOrganizations } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {}
  });

  // New Organization Form State
  const [orgForm, setOrgForm] = useState<Partial<Organization>>({
    name: '',
    type: 'HOSPITAL',
    registrationNumber: '',
    contactNumber: '',
    email: '',
    website: '',
    address: '',
    country: 'United States',
    state: 'New York',
    city: 'Metro City',
    postalCode: '10001',
    timezone: 'America/New_York',
    currency: 'USD',
    taxVatNumber: '',
    emergencyContact: '',
    status: 'ACTIVE'
  });

  // New Branch Form State
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    openingTime: '08:00',
    closingTime: '22:00',
    emergencyStatus: true,
    timezone: 'America/New_York',
    status: 'ACTIVE'
  });

  const loadBranches = async () => {
    try {
      const data = await api.getBranches(selectedOrg ? selectedOrg.id : undefined);
      setBranches(data);
    } catch (e) {
      console.error('Failed to load branches', e);
    }
  };

  useEffect(() => {
    loadBranches();
  }, [selectedOrg]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOrganization(orgForm);
      await refreshOrganizations();
      setIsCreateModalOpen(false);
      setOrgForm({
        name: '',
        type: 'HOSPITAL',
        registrationNumber: '',
        contactNumber: '',
        email: '',
        website: '',
        address: '',
        country: 'United States',
        state: 'New York',
        city: 'Metro City',
        postalCode: '10001',
        timezone: 'America/New_York',
        currency: 'USD',
        taxVatNumber: '',
        emergencyContact: '',
        status: 'ACTIVE'
      });
    } catch (err: any) {
      alert(err.message || 'Error creating organization');
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;
    try {
      await api.createBranch({ ...branchForm, organizationId: selectedOrg.id });
      await loadBranches();
      await refreshOrganizations();
      setIsBranchModalOpen(false);
      setBranchForm({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        manager: '',
        openingTime: '08:00',
        closingTime: '22:00',
        emergencyStatus: true,
        timezone: 'America/New_York',
        status: 'ACTIVE'
      });
    } catch (err: any) {
      alert(err.message || 'Error creating branch');
    }
  };

  const handleToggleOrgStatus = (org: Organization) => {
    const nextStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setConfirmDialog({
      isOpen: true,
      title: `${nextStatus === 'ACTIVE' ? 'Activate' : 'Suspend'} Organization`,
      message: `Are you sure you want to change the operating status of [${org.name}] to ${nextStatus}? This will impact staff logins and operations across all associated branches.`,
      action: async () => {
        await api.updateOrganization(org.id, { status: nextStatus });
        await refreshOrganizations();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const filteredOrgs = organizations.filter(org => {
    if (typeFilter !== 'ALL' && org.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && org.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        org.name.toLowerCase().includes(q) ||
        org.city.toLowerCase().includes(q) ||
        org.registrationNumber.toLowerCase().includes(q) ||
        org.contactNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Active</span>;
      case 'SUSPENDED':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3" /> Suspended</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Hospitals & Diagnostic Centers</h1>
          <p className="text-xs text-slate-500">
            Multi-organization tenancy management, regional branches, and facility licensing
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by facility name, city, license..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="ALL">All Facility Types</option>
            <option value="HOSPITAL">Hospitals</option>
            <option value="DIAGNOSTIC_CENTER">Diagnostic Centers</option>
            <option value="CLINIC">Clinics</option>
            <option value="MEDICAL_CENTER">Medical Centers</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Organization Name</th>
                <th className="py-3 px-4">Type & Reg Number</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Branches</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrgs.map(org => (
                <tr key={org.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{org.name}</div>
                        <div className="text-[10px] text-slate-400">ID: {org.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {org.type.replace('_', ' ')}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">{org.registrationNumber}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {org.city}, {org.country}
                    </div>
                    <div className="text-[10px] text-slate-400">{org.address}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => setSelectedOrg(org)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition border border-teal-200"
                    >
                      <Layers className="w-3 h-3" />
                      {org.branchCount || 1} Branches
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="text-slate-800 font-medium">{org.contactNumber}</div>
                    <div className="text-[10px] text-slate-400">{org.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {getStatusBadge(org.status)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrg(org)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                        title="Manage Branches"
                      >
                        Branches
                      </button>
                      <button
                        onClick={() => handleToggleOrgStatus(org)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                          org.status === 'ACTIVE'
                            ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {org.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Management Drawer / Drawer View */}
      {selectedOrg && (
        <div className="bg-white p-5 rounded-xl border-2 border-teal-500/30 shadow-md">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">Facility Branches</span>
                <h2 className="text-base font-bold text-slate-900">{selectedOrg.name}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Managing operational branches, emergency services and hours</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBranchModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Branch
              </button>
              <button
                onClick={() => setSelectedOrg(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Close Branches
              </button>
            </div>
          </div>

          {branches.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No branch registered yet for this facility. Click "Add Branch" above to register the main campus or satellite unit.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map(br => (
                <div key={br.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{br.name}</div>
                      <div className="text-[10px] text-slate-500">Code: <span className="font-mono">{br.code}</span></div>
                    </div>
                    {br.emergencyStatus && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        24/7 ER
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{br.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{br.openingTime} - {br.closingTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{br.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Organization */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Register Healthcare Organization</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateOrg} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.name}
                    onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Type</label>
                  <select
                    value={orgForm.type}
                    onChange={e => setOrgForm({ ...orgForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                  >
                    <option value="HOSPITAL">Hospital</option>
                    <option value="DIAGNOSTIC_CENTER">Diagnostic Center</option>
                    <option value="CLINIC">Daycare Clinic</option>
                    <option value="MEDICAL_CENTER">Medical Center</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Registration / License No. *</label>
                  <input
                    type="text"
                    required
                    value={orgForm.registrationNumber}
                    onChange={e => setOrgForm({ ...orgForm, registrationNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax / VAT Registration</label>
                  <input
                    type="text"
                    value={orgForm.taxVatNumber}
                    onChange={e => setOrgForm({ ...orgForm, taxVatNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={orgForm.city}
                    onChange={e => setOrgForm({ ...orgForm, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    value={orgForm.state}
                    onChange={e => setOrgForm({ ...orgForm, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={orgForm.country}
                    onChange={e => setOrgForm({ ...orgForm, country: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Phone</label>
                  <input
                    type="text"
                    value={orgForm.contactNumber}
                    onChange={e => setOrgForm({ ...orgForm, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={orgForm.email}
                    onChange={e => setOrgForm({ ...orgForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  Register Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Branch */}
      {isBranchModalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Branch to {selectedOrg.name}</h3>
              <button onClick={() => setIsBranchModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateBranch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. West Wing Campus"
                    value={branchForm.name}
                    onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR-WEST-01"
                    value={branchForm.code}
                    onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Physical street address"
                  value={branchForm.address}
                  onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Direct Phone</label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Manager</label>
                  <input
                    type="text"
                    value={branchForm.manager}
                    onChange={e => setBranchForm({ ...branchForm, manager: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="erCheck"
                  checked={branchForm.emergencyStatus}
                  onChange={e => setBranchForm({ ...branchForm, emergencyStatus: e.target.checked })}
                  className="rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="erCheck" className="text-xs font-medium text-slate-700">
                  24/7 Emergency Care Center Operating
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
