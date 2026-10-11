/**
 * Pattern HMS - Authentication & Organization Scope Context
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserSession, Role, Organization, Branch } from '../types';

interface AuthContextType {
  user: UserSession | null;
  role: Role | null;
  permissions: string[];
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  organizations: Organization[];
  branches: Branch[];
  refreshOrganizations: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const loadCurrentUser = async () => {
    const token = localStorage.getItem('pattern_hms_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setRole(data.role);
      setPermissions(data.permissions || []);
      await refreshOrganizations();
    } catch (err) {
      console.error('Session restore failed:', err);
      localStorage.removeItem('pattern_hms_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrganizations = async () => {
    try {
      const orgs = await api.getOrganizations();
      setOrganizations(orgs);
      const brs = await api.getBranches();
      setBranches(brs);
    } catch (e) {
      console.error('Failed to load orgs in context', e);
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      localStorage.setItem('pattern_hms_token', res.token);
      setUser(res.user);
      setRole(res.role);
      setPermissions(res.permissions || []);
      await refreshOrganizations();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('pattern_hms_token');
    setUser(null);
    setRole(null);
    setPermissions([]);
  };

  const hasPermission = (permCode: string): boolean => {
    if (!user) return false;
    if (user.roleCode === 'SUPER_ADMIN') return true;
    return permissions.includes(permCode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        isLoading,
        login,
        logout,
        hasPermission,
        selectedOrgId,
        setSelectedOrgId,
        selectedBranchId,
        setSelectedBranchId,
        organizations,
        branches,
        refreshOrganizations
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
