/**
 * Pattern HMS - System Settings, Health Diagnostics & Notifications View
 * Fully Multilingual (English / বাংলা)
 */
import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Activity,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  Clock,
  ShieldCheck,
  Building2,
  Mail,
  Sliders,
  Languages,
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { SystemSetting, NotificationTemplate, SystemHealth } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

export const SettingsView: React.FC = () => {
  const { tObj, language, setLanguage, isBangla } = useLanguage();
  const [activeTab, setActiveTab] = useState<'general' | 'templates' | 'health'>('general');
  const [settings, setSettings] = useState<SystemSetting | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const loadData = async () => {
    try {
      const [s, t, h] = await Promise.all([
        api.getSystemSettings(),
        api.getNotificationTemplates(),
        api.getSystemHealth()
      ]);
      setSettings(s);
      setTemplates(t);
      setHealth(h);
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      await api.updateSystemSettings(settings);
      setSaveFeedback(isBangla ? 'সিস্টেম সেটিংস সফলভাবে সংরক্ষিত হয়েছে।' : 'Pattern HMS System settings saved successfully.');
      setTimeout(() => setSaveFeedback(null), 4000);
    } catch (e: any) {
      alert(e.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    try {
      await api.resetDatabase();
      alert(isBangla ? 'ডেটাবেস প্রাথমিক ডেমো অবস্থায় রিসেট হয়েছে।' : 'Database reset to pristine seed state successfully.');
      window.location.reload();
    } catch (e: any) {
      alert(e.message || 'Failed to reset database');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{tObj.settings.title}</h1>
          <p className="text-xs text-slate-500">
            {tObj.settings.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'general' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tObj.settings.tabGeneral}
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'templates' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tObj.settings.tabTemplates}
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'health' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tObj.settings.tabHealth}
            </button>
          </div>
        </div>
      </div>

      {saveFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{saveFeedback}</span>
        </div>
      )}

      {/* TAB 1: GENERAL SETTINGS */}
      {activeTab === 'general' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-6 max-w-2xl">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900">{tObj.settings.enterpriseConfig}</h2>
            <p className="text-xs text-slate-500">{tObj.settings.enterpriseConfigDesc}</p>
          </div>

          {/* System Language Switcher Setting Card */}
          <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-teal-600" />
                  {tObj.settings.interfaceLanguage}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {tObj.settings.interfaceLanguageDesc}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSelector variant="pill" theme="light" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tObj.settings.appName} *
              </label>
              <input
                type="text"
                required
                value={settings.softwareName}
                onChange={e => setSettings({ ...settings, softwareName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tObj.settings.companyName}
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tObj.settings.supportEmail}
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tObj.settings.supportHotline}
              </label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tObj.settings.defaultCurrency}
              </label>
              <select
                value={settings.defaultCurrency}
                onChange={e => setSettings({ ...settings, defaultCurrency: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="BDT">BDT (৳)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tObj.settings.timezone}
              </label>
              <select
                value={settings.timezone}
                onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
              >
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dhaka">Asia/Dhaka (BST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tObj.settings.sessionTimeout}
              </label>
              <input
                type="number"
                value={settings.sessionTimeoutMinutes}
                onChange={e => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div>
              <div className="text-xs font-bold text-slate-900">{tObj.settings.maintenanceMode}</div>
              <div className="text-[11px] text-slate-500">{tObj.settings.maintenanceModeDesc}</div>
            </div>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {tObj.settings.resetDatabase}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSaving ? tObj.settings.saving : tObj.settings.saveChanges}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
            <h2 className="text-sm font-bold text-slate-900">
              {isBangla ? 'স্বয়ংক্রিয় রোগী মেসেজিং টেমপ্লেট' : 'Automated Patient Messaging Templates'}
            </h2>
            <p className="text-xs text-slate-500">
              {isBangla ? 'টোকেন, ইনভয়েস এবং প্যাথলজি রিপোর্টের জন্য এসএমএস ও ইমেইল অ্যালার্ট' : 'SMS, Email, and Push alerts for tokens, invoices, and diagnostic results'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{tpl.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    {tpl.channel}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
                  {tpl.bodyTemplate}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${tpl.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    {tpl.isEnabled ? (isBangla ? 'সক্রিয়' : 'Enabled') : (isBangla ? 'নিষ্ক্রিয়' : 'Disabled')}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">{tpl.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HEALTH */}
      {activeTab === 'health' && health && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Activity className="w-4 h-4 text-teal-600" />
                {isBangla ? 'সার্ভার স্ট্যাটাস' : 'Server Status'}
              </div>
              <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {health.status}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Clock className="w-4 h-4 text-sky-600" />
                {isBangla ? 'আপটাইম' : 'Uptime'}
              </div>
              <div className="text-lg font-bold text-slate-900">
                {Math.floor(health.uptime / 60)}m {Math.floor(health.uptime % 60)}s
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Cpu className="w-4 h-4 text-violet-600" />
                {isBangla ? 'মেমরি ব্যবহার' : 'Memory Usage'}
              </div>
              <div className="text-lg font-bold text-slate-900">
                {Math.round(health.memoryUsage.rss / 1024 / 1024)} MB
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Database className="w-4 h-4 text-amber-600" />
                {isBangla ? 'অডিটেড রেকর্ড' : 'Audited Records'}
              </div>
              <div className="text-lg font-bold text-slate-900">
                {health.activeDbConnections || 1} {isBangla ? 'টি সক্রিয় স্টোর' : 'Active Store'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for DB Reset */}
      <ConfirmDialog
        isOpen={confirmResetOpen}
        title={tObj.settings.resetDatabase}
        message={tObj.settings.databaseResetConfirm}
        confirmLabel={tObj.common.confirm}
        cancelLabel={tObj.common.cancel}
        variant="danger"
        onConfirm={() => {
          setConfirmResetOpen(false);
          handleResetDatabase();
        }}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
};
