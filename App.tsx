/**
 * Pattern HMS - Enterprise Hospital Management System
 * Super Admin Master Portal
 */
import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { QuickActionModal } from './components/QuickActionModal';
import { NavigationTab } from './types';

// Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { OrganizationsView } from './views/OrganizationsView';
import { UsersView } from './views/UsersView';
import { ClinicalView } from './views/ClinicalView';
import { DiagnosticsView } from './views/DiagnosticsView';
import { QueueView } from './views/QueueView';
import { BedsView } from './views/BedsView';
import { BillingView } from './views/BillingView';
import { ReportsView } from './views/ReportsView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';
import { ReceptionView } from './views/reception/ReceptionView';
import { DoctorView } from './views/doctor/DoctorView';
import { LaboratoryView } from './views/lab/LaboratoryView';
import { WaitingRoomDisplayView } from './views/display/WaitingRoomDisplayView';
import { FinanceView } from './views/finance/FinanceView';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { isBangla } = useLanguage();
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    return user?.roleCode === 'RECEPTIONIST' ? 'reception' : 'dashboard';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Switch initial tab when user logs in or role changes
  useEffect(() => {
    if (user?.roleCode === 'RECEPTIONIST') {
      setCurrentTab('reception');
    } else if (user) {
      setCurrentTab('dashboard');
    }
  }, [user?.id, user?.roleCode]);

  // Global Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-teal-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-300">
            {isBangla ? 'প্যাটার্ন এইচএমএস চালু হচ্ছে...' : 'Initializing Pattern HMS...'}
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentTab} onOpenQuickAction={() => setIsQuickActionOpen(true)} />;
      case 'organizations':
        return <OrganizationsView />;
      case 'users':
        return <UsersView />;
      case 'clinical':
        return <ClinicalView />;
      case 'diagnostics':
        return <DiagnosticsView />;
      case 'queue':
        return <QueueView />;
      case 'beds':
        return <BedsView />;
      case 'billing':
        return <BillingView />;
      case 'reports':
        return <ReportsView />;
      case 'audit':
        return <AuditView />;
      case 'settings':
        return <SettingsView />;
      case 'reception':
        return <ReceptionView />;
      case 'doctor':
        return <DoctorView />;
      case 'lab':
        return <LaboratoryView />;
      case 'finance':
        return <FinanceView />;
      case 'display':
        return <WaitingRoomDisplayView />;
      default:
        return <DashboardView onNavigate={setCurrentTab} onOpenQuickAction={() => setIsQuickActionOpen(true)} />;
    }
  };

  if (currentTab === 'display') {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="fixed top-4 right-20 z-50 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 backdrop-blur-xs transition cursor-pointer shadow-lg"
        >
          ✕ Exit TV Display
        </button>
        <WaitingRoomDisplayView />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Application Header */}
      <Header
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenQuickAction={() => setIsQuickActionOpen(true)}
        onNavigate={setCurrentTab}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Collapsible Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentTab}
      />

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigate={setCurrentTab}
      />

      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onNavigate={setCurrentTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RealtimeProvider>
          <MainLayout />
        </RealtimeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
