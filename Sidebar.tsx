/**
 * Pattern HMS - Super Admin Navigation Sidebar
 * Fully Multilingual (English / বাংলা)
 */
import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldAlert,
  Stethoscope,
  FlaskConical,
  Tv,
  BedDouble,
  ReceiptText,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  ClipboardList,
  Wallet,
  MonitorPlay,
  Microscope,
  UserCheck,
  X
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export interface SidebarProps {
  currentTab?: NavigationTab;
  activeTab?: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItemConfig {
  id: NavigationTab;
  labelKey:
    | 'receptionistPanel'
    | 'doctorPanel'
    | 'laboratoryWorkstation'
    | 'waitingRoomTV'
    | 'financeAccounts'
    | 'dashboard'
    | 'organizations'
    | 'usersRoles'
    | 'doctorsStaff'
    | 'diagnosticsPricing'
    | 'queueDisplays'
    | 'bedsWards'
    | 'billingPayments'
    | 'executiveReports'
    | 'auditSecurity'
    | 'settings';
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'live';
  roles?: string[];
}

interface NavSectionConfig {
  titleKey: 'frontDeskSection' | 'overviewSection' | 'enterpriseSection' | 'clinicalSection' | 'financeSection';
  items: NavItemConfig[];
}

const NAV_SECTIONS: NavSectionConfig[] = [
  {
    titleKey: 'frontDeskSection',
    items: [
      { id: 'reception', labelKey: 'receptionistPanel', icon: ClipboardList, badgeKey: 'live' },
      { id: 'doctor', labelKey: 'doctorPanel', icon: Stethoscope, badgeKey: 'live' },
      { id: 'laboratory', labelKey: 'laboratoryWorkstation', icon: Microscope, badgeKey: 'live' },
      { id: 'waitingDisplay', labelKey: 'waitingRoomTV', icon: MonitorPlay, badgeKey: 'live' },
      { id: 'finance', labelKey: 'financeAccounts', icon: Wallet }
    ]
  },
  {
    titleKey: 'overviewSection',
    items: [
      { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard }
    ]
  },
  {
    titleKey: 'enterpriseSection',
    items: [
      { id: 'organizations', labelKey: 'organizations', icon: Building2, roles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN'] },
      { id: 'users', labelKey: 'usersRoles', icon: Users, roles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN'] }
    ]
  },
  {
    titleKey: 'clinicalSection',
    items: [
      { id: 'clinical', labelKey: 'doctorsStaff', icon: Stethoscope },
      { id: 'diagnostics', labelKey: 'diagnosticsPricing', icon: FlaskConical },
      { id: 'queue', labelKey: 'queueDisplays', icon: Tv, badgeKey: 'live' },
      { id: 'beds', labelKey: 'bedsWards', icon: BedDouble }
    ]
  },
  {
    titleKey: 'financeSection',
    items: [
      { id: 'billing', labelKey: 'billingPayments', icon: ReceiptText },
      { id: 'reports', labelKey: 'executiveReports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'ACCOUNTANT'] },
      { id: 'audit', labelKey: 'auditSecurity', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ORGANIZATION_ADMIN'] },
      { id: 'settings', labelKey: 'settings', icon: Settings, roles: ['SUPER_ADMIN'] }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab: propCurrentTab,
  activeTab,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse,
  isOpen = false,
  onClose
}) => {
  const { user, role } = useAuth();
  const { tObj, isBangla } = useLanguage();
  const currentTab = propCurrentTab || activeTab || 'dashboard';

  const userRoleCode = user?.roleCode || 'SUPER_ADMIN';

  // Filter sections based on user role
  const filteredSections = NAV_SECTIONS.map(section => ({
    title: tObj.sidebar[section.titleKey],
    items: section.items
      .filter(item => !item.roles || item.roles.includes(userRoleCode))
      .map(item => ({
        id: item.id,
        label: tObj.sidebar[item.labelKey],
        icon: item.icon,
        badge: item.badgeKey === 'live' ? (isBangla ? 'লাইভ' : 'Live') : undefined
      }))
  })).filter(section => section.items.length > 0);

  const getRoleBadge = () => {
    if (userRoleCode === 'SUPER_ADMIN') return tObj.sidebar.superAdminPortal;
    if (userRoleCode === 'ORGANIZATION_ADMIN') return tObj.sidebar.hospitalAdminPortal;
    if (userRoleCode === 'RECEPTIONIST') return tObj.sidebar.receptionistWorkstation;
    return role?.name || tObj.sidebar.staffPortal;
  };

  const content = (
    <aside
      className={`relative flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 z-30 select-none h-full ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/20 flex-shrink-0">
            <HeartPulse className="w-6 h-6 stroke-[2.2]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white tracking-tight text-base">
                {tObj.sidebar.brandName}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-400 truncate">
                {getRoleBadge()}
              </span>
            </div>
          )}
        </div>

        {/* Collapse / Close button */}
        <div className="flex items-center">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isCollapsed ? tObj.sidebar.expandSidebar : tObj.sidebar.collapseSidebar}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={tObj.sidebar.closeMenu}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                {section.title}
              </div>
            )}
            <div className="space-y-1 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onClose) onClose();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-900/30'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/20">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div>
              <span className="font-medium text-slate-400">Pattern HMS</span> v2.4
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{tObj.sidebar.online}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400" title={tObj.sidebar.systemOnline}></span>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop view */}
      <div className="hidden lg:flex h-full">
        {content}
      </div>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-10 h-full">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
