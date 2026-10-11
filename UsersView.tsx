/**
 * Pattern HMS - User Management & RBAC Permissions Matrix View
 */
import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Plus,
  Search,
  Key,
  Unlock,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Building2,
  Lock,
  Edit2,
  Trash2,
  Save,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Role, Permission } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const UsersView: React.FC = () => {
  const { organizations, branches } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('Password@123');
  const [rolePermissionsDraft, setRolePermissionsDraft] = useState<string[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

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

  const [userForm, setUserForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    employeeId: '',
    roleCode: 'HOSPITAL_ADMIN',
    organizationId: organizations[0]?.id || '',
    branchId: branches[0]?.id || '',
    designation: '',
    password: 'Password@123'
  });

  const loadData = async () => {
    try {
      const [u, r, p] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getPermissionsCatalog()
      ]);
      setUsers(u);
      setRoles(r);
      setPermissionsCatalog(p);
      if (r.length > 0 && !selectedRole) {
        setSelectedRole(r[0]);
        setRolePermissionsDraft(r[0].permissions);
      }
    } catch (e) {
      console.error('Failed to load users data', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      setRolePermissionsDraft(selectedRole.permissions);
    }
  }, [selectedRole]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(userForm);
      await loadData();
      setIsCreateUserModalOpen(false);
      setUserForm({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        employeeId: '',
        roleCode: 'HOSPITAL_ADMIN',
        organizationId: organizations[0]?.id || '',
        branchId: branches[0]?.id || '',
        designation: '',
        password: 'Password@123'
      });
    } catch (err: any) {
      alert(err.message || 'Error creating user');
    }
  };

  const handleToggleSuspend = (user: any) => {
    const isSuspended = user.status === 'SUSPENDED';
    setConfirmDialog({
      isOpen: true,
      title: `${isSuspended ? 'Reactivate' : 'Suspend'} User Account`,
      message: `Are you sure you want to ${isSuspended ? 'reactivate' : 'suspend'} access for ${user.fullName} (${user.email})?`,
      action: async () => {
        await api.toggleSuspendUser(user.id);
        await loadData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUnlock = async (userId: string) => {
    try {
      await api.unlockUser(userId);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to unlock');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    try {
      await api.resetPassword(targetUser.id, newPasswordInput);
      alert(`Password reset successfully for ${targetUser.fullName}`);
      setIsResetPasswordModalOpen(false);
      setTargetUser(null);
    } catch (e: any) {
      alert(e.message || 'Failed to reset password');
    }
  };

  const handleTogglePermission = (code: string) => {
    if (selectedRole?.isSystemRole && selectedRole.code === 'SUPER_ADMIN') {
      alert('Super Admin permissions are protected and cannot be revoked.');
      return;
    }
    setRolePermissionsDraft(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSavingPermissions(true);
    try {
      await api.updateRolePermissions(selectedRole.id, rolePermissionsDraft);
      await loadData();
      alert(`Role [${selectedRole.name}] permissions saved successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to save permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'ALL' && u.roleCode !== roleFilter) return false;
    if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        u.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group permissions by module for the matrix
  const permissionsByModule = permissionsCatalog.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Access Control & Staff Management</h1>
          <p className="text-xs text-slate-500">
            Role-Based Access Control (RBAC), multi-tenant credentials, and granular permission enforcement
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub Tab Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeSubTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Directory
            </button>
            <button
              onClick={() => setActiveSubTab('roles')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeSubTab === 'roles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Roles & Permissions Matrix
            </button>
          </div>

          {activeSubTab === 'users' && (
            <button
              onClick={() => setIsCreateUserModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: USERS DIRECTORY */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, employee ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="ALL">All Roles</option>
                {roles.map(r => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="LOCKED">Locked</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Facility / Branch</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Security Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{user.fullName}</div>
                            <div className="text-[10px] text-slate-500">ID: {user.employeeId} • {user.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          <ShieldCheck className="w-3 h-3" />
                          {user.roleName || user.roleCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{user.organizationName || 'Global Platform'}</div>
                        <div className="text-[10px] text-slate-400">{user.branchName || 'All Branches'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="text-slate-800">{user.email}</div>
                        <div className="text-[10px] text-slate-400">{user.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {user.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                        {user.status === 'LOCKED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Locked (Failed Logins)
                          </span>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {user.status === 'LOCKED' && (
                            <button
                              onClick={() => handleUnlock(user.id)}
                              className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition flex items-center gap-1"
                              title="Unlock account"
                            >
                              <Unlock className="w-3 h-3" /> Unlock
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setTargetUser(user);
                              setIsResetPasswordModalOpen(true);
                            }}
                            className="px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition flex items-center gap-1"
                            title="Reset password"
                          >
                            <Key className="w-3 h-3" /> Password
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(user)}
                            className={`px-2 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
                              user.status === 'SUSPENDED'
                                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            <Ban className="w-3 h-3" />
                            {user.status === 'SUSPENDED' ? 'Activate' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ROLES & PERMISSIONS MATRIX */}
      {activeSubTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles List */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              System Roles
            </h3>
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedRole?.id === r.id
                    ? 'border-teal-500 bg-teal-50/60 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{r.name}</span>
                  {r.isSystemRole && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-sm bg-slate-200 text-slate-600 font-bold">
                      System
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{r.description}</div>
                <div className="mt-2 text-[10px] font-semibold text-teal-700">
                  {r.permissions.length} Assigned Permissions
                </div>
              </button>
            ))}
          </div>

          {/* Permissions Matrix */}
          <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{selectedRole?.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                    {selectedRole?.code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{selectedRole?.description}</p>
              </div>

              <button
                onClick={handleSavePermissions}
                disabled={isSavingPermissions || (selectedRole?.isSystemRole && selectedRole.code === 'SUPER_ADMIN')}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg transition shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingPermissions ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>

            {selectedRole?.code === 'SUPER_ADMIN' && (
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>The Super Administrator role inherently holds all platform permissions across every tenant.</span>
              </div>
            )}

            {/* Matrix by Module */}
            <div className="space-y-6">
              {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                <div key={moduleName} className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">
                    {moduleName} Module
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {(perms as Permission[]).map(p => {
                      const isChecked = rolePermissionsDraft.includes(p.code);
                      return (
                        <label
                          key={p.code}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition ${
                            isChecked
                              ? 'bg-teal-50/40 border-teal-300'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(p.code)}
                            disabled={selectedRole?.code === 'SUPER_ADMIN'}
                            className="mt-0.5 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800">{p.name}</div>
                            <div className="text-[11px] text-slate-500">{p.description}</div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{p.code}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Provision System User & Staff</h3>
              <button onClick={() => setIsCreateUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.fullName}
                    onChange={e => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EMP-1049"
                    value={userForm.employeeId}
                    onChange={e => setUserForm({ ...userForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role *</label>
                  <select
                    value={userForm.roleCode}
                    onChange={e => setUserForm({ ...userForm, roleCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                  >
                    {roles.map(r => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Medical Registrar"
                    value={userForm.designation}
                    onChange={e => setUserForm({ ...userForm, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Organization</label>
                  <select
                    value={userForm.organizationId}
                    onChange={e => setUserForm({ ...userForm, organizationId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                  >
                    <option value="">Global / Super Admin</option>
                    {organizations.map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {isResetPasswordModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Reset Password</h3>
              <button onClick={() => setIsResetPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Enter a new password for <span className="font-semibold text-slate-800">{targetUser.fullName}</span> ({targetUser.email}).
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password *</label>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition"
                >
                  Update Password
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
