/**
 * Pattern HMS - Super Admin Global Navigation Header
 * Fully Multilingual (English / বাংলা)
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  User,
  ShieldCheck,
  Plus,
  Activity,
  CheckCircle2,
  Settings,
  Languages,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { NavigationTab } from '../types';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenQuickAction: () => void;
  onOpenNotifications: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenQuickAction,
  onOpenNotifications,
  onNavigate
}) => {
  const { user, role, logout, organizations, selectedOrgId, setSelectedOrgId } = useAuth();
  const { tObj, language, setLanguage, isBangla } = useLanguage();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (scopeRef.current && !scopeRef.current.contains(event.target as Node)) {
        setIsScopeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOrg = organizations.find(o => o.id === selectedOrgId);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left: Organization Scope Switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="relative" ref={scopeRef}>
          <button
            onClick={() => setIsScopeOpen(!isScopeOpen)}
            className="flex items-center gap-2 px-2.5 sm:px-3.5 py-1.5 text-sm font-medium bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 rounded-lg border border-slate-200/60 transition shadow-2xs cursor-pointer"
          >
            <div className="p-1 bg-teal-600 text-white rounded-md">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                {tObj.header.hospitalScope}
              </div>
              <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]">
                {selectedOrg ? selectedOrg.name : tObj.header.globalFacility}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {isScopeOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {tObj.header.selectFacility}
              </div>
              <button
                onClick={() => {
                  setSelectedOrgId('');
                  setIsScopeOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                  !selectedOrgId ? 'bg-teal-50/70 text-teal-900 font-semibold' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <div>
                    <div className="font-medium text-xs">{tObj.header.globalFacility}</div>
                    <div className="text-[11px] text-slate-500">{tObj.header.allFacilitiesDesc}</div>
                  </div>
                </div>
                {!selectedOrgId && <CheckCircle2 className="w-4 h-4 text-teal-600" />}
              </button>

              <div className="h-px bg-slate-100 my-1" />

              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setSelectedOrgId(org.id);
                    setIsScopeOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                    selectedOrgId === org.id ? 'bg-teal-50/70 text-teal-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-medium text-xs truncate">{org.name}</div>
                    <div className="text-[11px] text-slate-500">{org.city}, {org.country} • {org.type}</div>
                  </div>
                  {selectedOrgId === org.id && <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 ml-2" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search trigger */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-3 px-3.5 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition w-56 lg:w-64 justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{tObj.header.searchPlaceholder}</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-slate-300 rounded-sm text-slate-500 flex-shrink-0">⌘K</kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Changing Option (Visible prominently for every user) */}
        <div className="flex items-center" title={tObj.header.languageSelect}>
          <LanguageSelector variant="pill" theme="light" />
        </div>

        {/* Quick Action Button */}
        <button
          onClick={onOpenQuickAction}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">{tObj.header.quickCreate}</span>
        </button>

        {/* System Health Badge */}
        <div 
          onClick={() => onNavigate('settings')}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-medium cursor-pointer hover:bg-emerald-100 transition"
          title={tObj.header.systemsLiveTooltip}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold">{tObj.header.systemsLive}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title={tObj.header.notifications}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-teal-100">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                {user?.fullName || 'Administrator'}
              </div>
              <div className="text-[10px] text-teal-600 font-medium">
                {role?.name || 'Staff'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-900">{user?.fullName}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md text-[10px] font-semibold">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  {role?.code || 'STAFF'}
                </div>
              </div>

              {/* Language Switch Row inside Profile Dropdown */}
              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <Globe className="w-3.5 h-3.5 text-teal-600" />
                  <span>{isBangla ? 'ভাষা:' : 'Language:'}</span>
                </div>
                <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                      language === 'en' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('bn')}
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                      language === 'bn' ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    বাংলা
                  </button>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('users');
                  }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {tObj.header.staffAccess}
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('audit');
                  }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  {tObj.header.auditLogs}
                </button>
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  {tObj.header.systemConfig}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-medium transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {tObj.header.signOut} ({role?.name || 'Session'})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
