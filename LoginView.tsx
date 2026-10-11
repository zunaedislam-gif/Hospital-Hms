/**
 * Pattern HMS - Super Admin Authentication Screen
 * Fully Multilingual (English / বাংলা)
 */
import React, { useState } from 'react';
import {
  HeartPulse,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { tObj, isBangla } = useLanguage();
  const [username, setUsername] = useState('superadmin@patternhms.com');
  const [password, setPassword] = useState('Password@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.message || tObj.auth.authFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (email: string, pass: string) => {
    setUsername(email);
    setPassword(pass);
    setError(null);
  };

  const handleInstantLogin = async (email: string, pass: string) => {
    setUsername(email);
    setPassword(pass);
    setError(null);
    setIsLoading(true);
    try {
      await login({ username: email, password: pass });
    } catch (err: any) {
      setError(err.message || tObj.auth.authFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const getActiveRoleBadge = () => {
    const q = username.toLowerCase();
    if (q.includes('reception') || q.includes('clara')) {
      return {
        name: tObj.auth.frontDeskBadge,
        desc: tObj.auth.frontDeskDesc,
        icon: CheckCircle2,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200'
      };
    }
    if (q.includes('central') || q.includes('hospital') || q.includes('admin.pch')) {
      return {
        name: tObj.auth.hospitalAdminBadge,
        desc: tObj.auth.hospitalAdminDesc,
        icon: Building2,
        color: 'text-sky-700 bg-sky-50 border-sky-200'
      };
    }
    return {
      name: tObj.auth.superAdminBadge,
      desc: tObj.auth.superAdminDesc,
      icon: ShieldCheck,
      color: 'text-teal-700 bg-teal-50 border-teal-200'
    };
  };

  const activeBadge = getActiveRoleBadge();
  const ActiveIcon = activeBadge.icon;

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white relative overflow-hidden">
      {/* Subtle geometric background accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Top Bar with Language Selector */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
          <Globe className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-[11px] font-semibold text-slate-300">
            {tObj.auth.chooseLanguage}:
          </span>
          <LanguageSelector variant="pill" theme="dark" />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-xl shadow-teal-500/20 ring-4 ring-white/10">
            <HeartPulse className="w-8 h-8 text-white stroke-[2.3]" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-white">
          Pattern HMS {isBangla && <span className="text-teal-400 font-normal">| প্যাটার্ন</span>}
        </h2>
        <p className="mt-1 text-center text-xs text-teal-300 font-medium tracking-wide">
          {tObj.auth.signInSubtitle}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md py-7 px-6 shadow-2xl rounded-2xl border border-white/20 sm:px-10 text-slate-800">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{tObj.auth.signInTitle}</h3>
              <p className="text-[11px] text-slate-500">{activeBadge.desc}</p>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${activeBadge.color}`}>
              <ActiveIcon className="w-3 h-3" /> {activeBadge.name}
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tObj.auth.emailOrUsername}
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={tObj.auth.emailPlaceholder}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tObj.auth.password}
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tObj.auth.passwordPlaceholder}
                  className="block w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <span>{tObj.auth.keepSessionActive}</span>
              </label>
              <span className="text-slate-400 text-[11px]">{tObj.auth.encrypted}</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {tObj.auth.authenticating}
                </>
              ) : (
                <>
                  {tObj.auth.signInButton} ({activeBadge.name})
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              {tObj.auth.oneClickDemo}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Super Admin */}
              <div className="p-2.5 bg-slate-50 hover:bg-teal-50/70 border border-slate-200 hover:border-teal-300 rounded-xl transition flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>{tObj.auth.superAdminBadge}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">superadmin@patternhms.com</div>
                </div>
                <div className="mt-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleInstantLogin('superadmin@patternhms.com', 'Password@123')}
                    disabled={isLoading}
                    className="flex-1 py-1 px-2 text-[10px] font-semibold rounded bg-teal-600 hover:bg-teal-700 text-white transition text-center shadow-2xs cursor-pointer"
                  >
                    {tObj.auth.instantLogin}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('superadmin@patternhms.com', 'Password@123')}
                    className="py-1 px-1.5 text-[10px] font-medium rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition cursor-pointer"
                    title={tObj.auth.fillCredentials}
                  >
                    {tObj.auth.fillCredentials}
                  </button>
                </div>
              </div>

              {/* Hospital Admin */}
              <div className="p-2.5 bg-slate-50 hover:bg-sky-50/70 border border-slate-200 hover:border-sky-300 rounded-xl transition flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>{tObj.auth.hospitalAdminBadge}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">admin@centralhospital.com</div>
                </div>
                <div className="mt-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleInstantLogin('admin@centralhospital.com', 'Password@123')}
                    disabled={isLoading}
                    className="flex-1 py-1 px-2 text-[10px] font-semibold rounded bg-sky-600 hover:bg-sky-700 text-white transition text-center shadow-2xs cursor-pointer"
                  >
                    {tObj.auth.instantLogin}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@centralhospital.com', 'Password@123')}
                    className="py-1 px-1.5 text-[10px] font-medium rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition cursor-pointer"
                    title={tObj.auth.fillCredentials}
                  >
                    {tObj.auth.fillCredentials}
                  </button>
                </div>
              </div>

              {/* Receptionist */}
              <div className="p-2.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-xl transition flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{tObj.auth.frontDeskBadge}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">clara.reception@centralhospital.com</div>
                </div>
                <div className="mt-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleInstantLogin('clara.reception@centralhospital.com', 'Password@123')}
                    disabled={isLoading}
                    className="flex-1 py-1 px-2 text-[10px] font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition text-center shadow-2xs cursor-pointer"
                  >
                    {tObj.auth.instantLogin}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('clara.reception@centralhospital.com', 'Password@123')}
                    className="py-1 px-1.5 text-[10px] font-medium rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition cursor-pointer"
                    title={tObj.auth.fillCredentials}
                  >
                    {tObj.auth.fillCredentials}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-2.5 text-center text-[10px] text-slate-500">
              {tObj.auth.demoPasswordNotice} <span className="font-mono font-semibold text-slate-700">Password@123</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          {tObj.auth.footerTagline}
        </p>
      </div>
    </div>
  );
};
