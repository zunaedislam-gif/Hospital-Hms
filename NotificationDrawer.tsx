/**
 * Pattern HMS - Notification Drawer & System Alerts
 * Fully Multilingual (English / বাংলা)
 */
import React from 'react';
import { X, ShieldAlert, CheckCircle2, Clock, AlertTriangle, Info, Bell } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { isBangla, tObj } = useLanguage();

  if (!isOpen) return null;

  const alerts = [
    {
      id: 'notif_1',
      type: 'warning',
      title: isBangla ? 'উচ্চ বেড দখল সতর্কবার্তা' : 'High Bed Occupancy Alert',
      message: isBangla 
        ? 'সেন্ট্রাল হসপিটালের আইসিইউ ওয়ার্ডে বেড ধারণক্ষমতার ৮৫% অতিক্রম করেছে।' 
        : 'Central Hospital ICU Ward has reached 85% occupancy rate.',
      time: isBangla ? '৮ মিনিট আগে' : '8 minutes ago',
      unread: true
    },
    {
      id: 'notif_2',
      type: 'security',
      title: isBangla ? 'একাধিক লগইন ব্যর্থতা সনাক্ত' : 'Multiple Login Failures Detected',
      message: isBangla 
        ? 'আইপি ১৯২.১৬৮.১.১৪৪ থেকে পরপর ৫ বার ভুল পাসওয়ার্ড দিয়ে লগইনের চেষ্টা করা হয়েছে।' 
        : 'IP 192.168.1.144 triggered 5 consecutive failed logins for user [finance@centralhospital.com]. Account locked temporarily.',
      time: isBangla ? '২৪ মিনিট আগে' : '24 minutes ago',
      unread: true
    },
    {
      id: 'notif_3',
      type: 'success',
      title: isBangla ? 'ডায়াগনস্টিক পরীক্ষার মূল্য হালনাগাদ' : 'Diagnostic Price Revision Published',
      message: isBangla 
        ? 'এমআরআই ব্রেন উইথ কনট্রাস্ট পরীক্ষার নতুন ফি সুপার অ্যাডমিন দ্বারা কার্যকর হয়েছে।' 
        : 'Global base price for MRI Brain with Contrast updated by Super Admin.',
      time: isBangla ? '২ ঘণ্টা আগে' : '2 hours ago',
      unread: false
    },
    {
      id: 'notif_4',
      type: 'info',
      title: isBangla ? 'কিউ ওয়েটিং স্ক্রিন সিঙ্ক্রোনাইজড' : 'Queue Display Screen Synchronized',
      message: isBangla 
        ? 'পূর্ব উইং ওয়েটিং হলের ডিজিটাল ডিসপ্লে স্ক্রিন [Screen-A3] অনলাইনে সংযুক্ত।' 
        : 'Display Screen [Screen-A3] online in East Wing Waiting Hall.',
      time: isBangla ? '৪ ঘণ্টা আগে' : '4 hours ago',
      unread: false
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                {tObj.header.notifications}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBangla ? 'নিরাপত্তা বার্তা ও জরুরি স্বাস্থ্য বিজ্ঞপ্তি' : 'Security warnings & critical hospital alerts'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border transition ${
                alert.unread ? 'bg-slate-50/80 border-slate-300 shadow-xs' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  {alert.type === 'security' && <ShieldAlert className="w-4 h-4 text-rose-500" />}
                  {alert.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  {alert.type === 'info' && <Info className="w-4 h-4 text-sky-500" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{alert.title}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>{isBangla ? 'লগ রেকর্ড স্বয়ংক্রিয় সংরক্ষিত' : 'Security logs stored indefinitely'}</span>
          <button className="text-teal-600 hover:underline font-medium cursor-pointer">
            {isBangla ? 'সব পঠিত হিসেবে চিহ্নিত করুন' : 'Mark all read'}
          </button>
        </div>
      </div>
    </div>
  );
};
