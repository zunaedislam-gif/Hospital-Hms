/**
 * Pattern HMS - Queue Management, Display Screens & Voice Settings View
 */
import React, { useState, useEffect } from 'react';
import {
  Tv,
  Volume2,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  Users,
  Clock,
  Shield,
  Bell,
  Sparkles,
  RefreshCw,
  Eye,
  Maximize2,
  Radio,
  ArrowRight,
  Plus,
  Check,
  UserX,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { QueueItem, DisplayScreen, QueueSoundSetting, QueueRule } from '../types';

export const QueueView: React.FC = () => {
  const { organizations, branches } = useAuth();
  const { isBangla, formatNumber } = useLanguage();
  const [activeTab, setActiveTab] = useState<'liveQueue' | 'displays' | 'voice' | 'rules'>('liveQueue');
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [displayScreens, setDisplayScreens] = useState<DisplayScreen[]>([]);
  const [soundSettings, setSoundSettings] = useState<QueueSoundSetting | null>(null);
  const [queueRules, setQueueRules] = useState<QueueRule | null>(null);
  const [selectedScreenForPreview, setSelectedScreenForPreview] = useState<DisplayScreen | null>(null);
  const [isCallingAudio, setIsCallingAudio] = useState(false);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New walk-in token form
  const [newPatientName, setNewPatientName] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('Dr. Sarah Mitchell, MD');
  const [newChamberName, setNewChamberName] = useState('Room 101 - Cardiology Clinic');
  const [newIsEmergency, setNewIsEmergency] = useState(false);

  const loadData = async () => {
    try {
      const [q, d, s, r] = await Promise.all([
        api.getQueueItems(),
        api.getDisplayScreens(),
        api.getQueueSoundSettings(),
        api.getQueueRules()
      ]);
      setQueueItems(q);
      setDisplayScreens(d);
      setSoundSettings(s);
      setQueueRules(r);
    } catch (e) {
      console.error('Failed to load queue telemetry', e);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000); // 10s polling for live display refresh
    return () => clearInterval(timer);
  }, []);

  const handleCallPatient = async (item: QueueItem) => {
    // 1. Optimistically update local state immediately so UI changes without delay
    setQueueItems(prev =>
      prev.map(q => (q.id === item.id || q.tokenNumber === item.tokenNumber ? { ...q, status: 'CALLED' } : q))
    );
    setLastAnnouncedToken(item.tokenNumber);
    setIsCallingAudio(true);
    setFeedbackMessage(
      isBangla
        ? `টোকেন #${item.tokenNumber} কল করা হয়েছে (${item.patientName})`
        : `Token #${item.tokenNumber} called (${item.patientName})`
    );

    // 2. Play native Web Speech API synthesis announcement
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const textToAnnounce = isBangla
          ? `টোকেন নম্বর ${item.tokenNumber}, দয়া করে ${item.chamberName || 'চেম্বারে'} আসুন`
          : `Token number ${item.tokenNumber.split('').join(' ')}, please proceed to ${item.chamberName}`;
        const utterance = new SpeechSynthesisUtterance(textToAnnounce);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        if (isBangla) {
          utterance.lang = 'bn-BD';
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis unavailable', err);
      }
    }

    setTimeout(() => setIsCallingAudio(false), 3500);

    // 3. Persist to API and backend store
    try {
      await api.callQueuePatient(item.id);
    } catch (e: any) {
      console.error('Error calling patient', e);
    }
  };

  const handleUpdateStatus = async (item: QueueItem, status: any) => {
    // 1. Optimistically update local state immediately so counters & badge update instantly
    setQueueItems(prev =>
      prev.map(q => (q.id === item.id || q.tokenNumber === item.tokenNumber ? { ...q, status } : q))
    );

    const statusNames: Record<string, string> = {
      IN_CONSULTATION: isBangla ? 'বর্তমানে চেম্বারে' : 'In Chamber',
      COMPLETED: isBangla ? 'পরামর্শ সম্পন্ন' : 'Completed',
      WAITING: isBangla ? 'অপেক্ষমান তালিকায় ফেরানো হয়েছে' : 'Waiting in Lounge',
      SKIPPED: isBangla ? 'অনুপস্থিত হিসেবে চিহ্নিত' : 'Marked as Skipped'
    };

    setFeedbackMessage(
      `${item.tokenNumber}: ${statusNames[status] || status}`
    );
    setTimeout(() => setFeedbackMessage(null), 3000);

    // 2. Persist to API and backend store
    try {
      await api.updateQueueStatus(item.id, status);
    } catch (e: any) {
      console.error('Error updating status', e);
    }
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const prefix = newIsEmergency ? 'E' : 'A';
    const nextSeq = queueItems.length + 14;
    const tokenNum = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

    const newItem: QueueItem = {
      id: 'q_' + Math.random().toString(36).substr(2, 8),
      tokenNumber: tokenNum,
      sequenceNumber: nextSeq,
      patientName: newPatientName.trim(),
      patientId: 'pat_' + Math.floor(100 + Math.random() * 900),
      doctorName: newDoctorName,
      departmentName: newChamberName.includes('Cardiology') ? 'Cardiology Clinic' : 'General Medicine',
      chamberName: newChamberName,
      status: 'WAITING',
      timeWaitingMinutes: 0,
      estimatedWaitMinutes: newIsEmergency ? 2 : 15,
      isEmergency: newIsEmergency
    };

    setQueueItems(prev => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setNewPatientName('');
    setFeedbackMessage(
      isBangla ? `নতুন টোকেন #${tokenNum} সফলভাবে তৈরি হয়েছে` : `New token #${tokenNum} successfully issued`
    );

    try {
      await api.updateQueueStatus(newItem.id, 'WAITING');
    } catch (e) {}
  };

  const handleSaveSoundSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soundSettings) return;
    try {
      await api.updateQueueSoundSettings(soundSettings);
      alert(isBangla ? 'শব্দ সেটিংস সংরক্ষিত হয়েছে।' : 'Queue acoustic notification settings saved.');
    } catch (e: any) {
      alert(e.message || 'Error saving settings');
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueRules) return;
    try {
      await api.updateQueueRules(queueRules);
      alert(isBangla ? 'কিউ নীতি সফলভাবে সংরক্ষিত হয়েছে।' : 'Queue progression and privacy rules saved.');
    } catch (e: any) {
      alert(e.message || 'Error saving rules');
    }
  };

  const testVoiceSample = () => {
    if ('speechSynthesis' in window) {
      const phrase = isBangla
        ? 'টোকেন এ-১০২, দয়া করে কনসালটেশন চেম্বার ১০১-এ আসুন।'
        : 'Token A-102, please proceed to Consultation Chamber 101.';
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 0.9;
      if (isBangla) utterance.lang = 'bn-BD';
      window.speechSynthesis.speak(utterance);
    } else {
      alert(isBangla ? 'ভয়েস পরীক্ষা সফল।' : 'Voice synthesis previewed successfully.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {isBangla ? 'কিউ ইঞ্জিন ও ডিজিটাল ডিসপ্লে স্ক্রিন' : 'Queue Engine & Digital Display Screens'}
          </h1>
          <p className="text-xs text-slate-500">
            {isBangla
              ? 'রিয়েল-টাইম বহির্বিভাগ টোকেন ব্যবস্থাপনা, ভয়েস ঘোষণা এবং অপেক্ষাগার ডিজিটাল সাইনেজ'
              : 'Real-time outpatient tokens, automated voice announcements, and waiting room digital signage'}
          </p>
        </div>

        {/* Action Tabs & Issue Token Button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            {isBangla ? 'নতুন টোকেন প্রদান' : 'Issue New Token'}
          </button>

          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('liveQueue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'liveQueue' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBangla ? 'লাইভ টোকেন' : 'Live Tokens'}
            </button>
            <button
              onClick={() => setActiveTab('displays')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'displays' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBangla ? 'অপেক্ষাগার স্ক্রিন' : 'Waiting Room Screens'}
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'voice' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBangla ? 'ভয়েস ও অডিও' : 'Voice & Audio'}
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTab === 'rules' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isBangla ? 'নিয়ম ও গোপনীয়তা' : 'Queue Rules & Privacy'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating or Top Feedback Notification */}
      {feedbackMessage && (
        <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between shadow-lg text-xs font-medium animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Acoustic Active Alert Banner */}
      {isCallingAudio && (
        <div className="p-3 bg-teal-600 text-white rounded-xl flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-teal-200" />
            <span className="text-xs font-bold">
              {isBangla ? 'মাইকে ঘোষণা ও ডিসপ্যাচ সম্প্রচার: টোকেন ' : 'Broadcasting Chime & Voice Dispatch: Token '}
              <span className="font-mono underline text-sm">{lastAnnouncedToken}</span>
            </span>
          </div>
          <span className="text-[11px] bg-teal-700 px-2.5 py-0.5 rounded-full font-semibold">
            {isBangla ? 'অপেক্ষাগার টিভিতে প্রদর্শিত হচ্ছে' : 'Broadcasting to Waiting Screens'}
          </span>
        </div>
      )}

      {/* TAB 1: LIVE QUEUE TOKENS */}
      {activeTab === 'liveQueue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isBangla ? 'আজকের মোট টোকেন' : 'Total in Queue Today'}
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{formatNumber(queueItems.length)}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isBangla ? 'অপেক্ষারত রোগী' : 'Waiting in Lounge'}
              </span>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {formatNumber(queueItems.filter(q => q.status === 'WAITING').length)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isBangla ? 'বর্তমানে চেম্বারে' : 'Currently in Chamber'}
              </span>
              <div className="text-2xl font-bold text-teal-600 mt-1">
                {formatNumber(
                  queueItems.filter(q => q.status === 'IN_CONSULTATION' || q.status === 'CALLED').length
                )}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isBangla ? 'পরামর্শ সম্পন্ন' : 'Consultation Completed'}
              </span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                {formatNumber(queueItems.filter(q => q.status === 'COMPLETED').length)}
              </div>
            </div>
          </div>

          {/* Tokens Grid */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="text-xs font-bold text-slate-800">
                {isBangla ? 'বহির্বিভাগ টোকেন তালিকা' : 'Active Outpatient Queue'}
              </div>
              <div className="text-xs text-slate-500">
                {isBangla
                  ? `${formatNumber(queueItems.length)} টি টোকেন তালিকাভুক্ত`
                  : `${queueItems.length} active entries`}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{isBangla ? 'টোকেন #' : 'Token #'}</th>
                    <th className="py-3 px-4">{isBangla ? 'রোগীর নাম' : 'Patient Name'}</th>
                    <th className="py-3 px-4">{isBangla ? 'ডাক্তার ও বিভাগ' : 'Doctor & Specialty'}</th>
                    <th className="py-3 px-4">{isBangla ? 'চেম্বার' : 'Chamber'}</th>
                    <th className="py-3 px-4">{isBangla ? 'অপেক্ষার সময়' : 'Wait Time'}</th>
                    <th className="py-3 px-4">{isBangla ? 'অবস্থা' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{isBangla ? 'নিয়ন্ত্রণ' : 'Dispatch Control'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queueItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold">
                        <span className="font-mono text-sm px-2.5 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 inline-flex items-center gap-1">
                          {item.tokenNumber}
                          {item.isEmergency && (
                            <span className="w-2 h-2 rounded-full bg-rose-500" title="Emergency" />
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div>{item.patientName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          MRN: {item.patientId || 'pat_001'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{item.doctorName}</div>
                        <div className="text-[10px] text-slate-400">{item.departmentName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-teal-700">
                        {item.chamberName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatNumber(item.estimatedWaitMinutes || 15)} {isBangla ? 'মিনিট' : 'mins'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === 'CALLED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 animate-pulse border border-teal-200">
                            {isBangla ? 'ডাকা হচ্ছে' : 'Calling Now'}
                          </span>
                        )}
                        {item.status === 'WAITING' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            {isBangla ? 'অপেক্ষমান' : 'Waiting'}
                          </span>
                        )}
                        {item.status === 'IN_CONSULTATION' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            {isBangla ? 'চেম্বারে' : 'In Chamber'}
                          </span>
                        )}
                        {item.status === 'COMPLETED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {isBangla ? 'সম্পন্ন' : 'Done'}
                          </span>
                        )}
                        {item.status === 'SKIPPED' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            {isBangla ? 'অনুপস্থিত' : 'No Show'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Call Button */}
                          <button
                            onClick={() => handleCallPatient(item)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 ${
                              item.status === 'CALLED'
                                ? 'bg-teal-700 text-white ring-2 ring-teal-400 animate-pulse'
                                : 'bg-teal-600 hover:bg-teal-700 text-white'
                            }`}
                            title={isBangla ? 'টোকেন ডাকুন' : 'Call token with audio announcement'}
                          >
                            <Volume2 className="w-3 h-3" />
                            {item.status === 'CALLED'
                              ? isBangla
                                ? 'ডাকা হচ্ছে'
                                : 'Calling...'
                              : isBangla
                              ? 'কল'
                              : 'Call'}
                          </button>

                          {/* In Chamber Button */}
                          <button
                            onClick={() => handleUpdateStatus(item, 'IN_CONSULTATION')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition cursor-pointer active:scale-95 ${
                              item.status === 'IN_CONSULTATION'
                                ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-300 shadow-xs'
                                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                            }`}
                            title={isBangla ? 'রোগীকে চেম্বারে প্রবেশ করান' : 'Mark patient entering chamber'}
                          >
                            {item.status === 'IN_CONSULTATION' && <Check className="w-3 h-3 inline mr-0.5" />}
                            {isBangla ? 'চেম্বারে' : 'In Chamber'}
                          </button>

                          {/* Complete Button */}
                          <button
                            onClick={() => handleUpdateStatus(item, 'COMPLETED')}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition border cursor-pointer active:scale-95 ${
                              item.status === 'COMPLETED'
                                ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-300 shadow-xs border-emerald-600'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            }`}
                            title={isBangla ? 'পরামর্শ সম্পন্ন করুন' : 'Mark consultation completed'}
                          >
                            {item.status === 'COMPLETED' && <Check className="w-3 h-3 inline mr-0.5" />}
                            {isBangla ? 'সম্পন্ন' : 'Complete'}
                          </button>

                          {/* Revert / Re-call to Waiting button if not currently waiting */}
                          {item.status !== 'WAITING' && (
                            <button
                              onClick={() => handleUpdateStatus(item, 'WAITING')}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition cursor-pointer"
                              title={isBangla ? 'পুনরায় অপেক্ষমান তালিকায় রাখুন' : 'Revert to Waiting in Lounge'}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Skip / No-show button */}
                          {item.status === 'CALLED' && (
                            <button
                              onClick={() => handleUpdateStatus(item, 'SKIPPED')}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title={isBangla ? 'অনুপস্থিত (No-show)' : 'Mark Skipped / No Show'}
                            >
                              <UserX className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* MODAL: Issue New Walk-in Token */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {isBangla ? 'নতুন বহির্বিভাগ টোকেন প্রদান' : 'Issue New Outpatient Token'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateToken} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBangla ? 'রোগীর নাম *' : 'Patient Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBangla ? 'রোগীর পূর্ণ নাম লিখুন' : 'e.g. Rachel Adams'}
                  value={newPatientName}
                  onChange={e => setNewPatientName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isBangla ? 'ডাক্তার নির্বাচন' : 'Doctor & Chamber'}
                </label>
                <select
                  value={newDoctorName}
                  onChange={e => {
                    const doc = e.target.value;
                    setNewDoctorName(doc);
                    if (doc.includes('Mitchell')) {
                      setNewChamberName('Room 101 - Cardiology Clinic');
                    } else if (doc.includes('Chang')) {
                      setNewChamberName('Room 204 - Neurology Suite');
                    } else {
                      setNewChamberName('Room 105 - Endocrinology');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                >
                  <option value="Dr. Sarah Mitchell, MD">Dr. Sarah Mitchell, MD (Room 101 - Cardiology)</option>
                  <option value="Dr. Michael Chang, FRCS">Dr. Michael Chang, FRCS (Room 204 - Neurology)</option>
                  <option value="Dr. Elena Rostova, MD">Dr. Elena Rostova, MD (Room 105 - Endocrinology)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={newIsEmergency}
                    onChange={e => setNewIsEmergency(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <span>
                    {isBangla ? 'জরুরি অগ্রাধিকার টোকেন (ইমার্জেন্সি)' : 'Emergency Priority Token (Top of Queue)'}
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  {isBangla ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-xs"
                >
                  {isBangla ? 'টোকেন প্রিন্ট ও ইস্যু করুন' : 'Generate & Issue Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: WAITING ROOM SCREENS */}
      {activeTab === 'displays' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayScreens.map(screen => (
              <div key={screen.id} className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col justify-between">
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                        <Tv className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs">{screen.screenName}</h3>
                        <div className="text-[10px] font-mono text-slate-400">{screen.screenCode}</div>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <div><span className="font-semibold text-slate-500">Zone:</span> {screen.displayZone}</div>
                    <div><span className="font-semibold text-slate-500">Target Doctors:</span> {screen.targetDoctorIds.length} Linked Doctors</div>
                    <div><span className="font-semibold text-slate-500">Resolution:</span> {screen.resolution}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                    <div className="font-semibold text-slate-800 mb-0.5">Active Marquee Banner:</div>
                    <div className="italic text-slate-500">"{screen.marqueeText}"</div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedScreenForPreview(screen)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                    Open Digital TV Simulation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VOICE & AUDIO ANNOUNCEMENT SETTINGS */}
      {activeTab === 'voice' && soundSettings && (
        <form onSubmit={handleSaveSoundSettings} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-6 max-w-2xl">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900">Acoustic Chime & Speech Synthesis Config</h2>
            <p className="text-xs text-slate-500">Configure how tokens are vocalized in patient waiting lobbies</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div>
                <div className="text-xs font-bold text-slate-900">Enable Automated Token Voice Announcement</div>
                <div className="text-[11px] text-slate-500">Vocalize token number and chamber upon dispatch</div>
              </div>
              <input
                type="checkbox"
                checked={soundSettings.enableVoiceAnnouncement}
                onChange={e => setSoundSettings({ ...soundSettings, enableVoiceAnnouncement: e.target.checked })}
                className="w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pre-Call Chime Tone</label>
                <select
                  value={soundSettings.chimeTone}
                  onChange={e => setSoundSettings({ ...soundSettings, chimeTone: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                >
                  <option value="AIRPORT_CHIME">Airport Double Chime</option>
                  <option value="HOSPITAL_BELL">Hospital Subtle Ding</option>
                  <option value="MELODIC_TRIAD">Melodic Triad Tone</option>
                  <option value="SUBTLE_BEEP">Subtle Soft Beep</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Language</label>
                <select
                  value={soundSettings.voiceLanguage}
                  onChange={e => setSoundSettings({ ...soundSettings, voiceLanguage: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish (Español)</option>
                  <option value="bn-BD">Bengali (বাংলা)</option>
                  <option value="ar-SA">Arabic (العربية)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Volume ({soundSettings.volumePercent}%)
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={soundSettings.volumePercent}
                  onChange={e => setSoundSettings({ ...soundSettings, volumePercent: Number(e.target.value) })}
                  className="w-full text-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Repetitions Per Call</label>
                <select
                  value={soundSettings.repeatTimes}
                  onChange={e => setSoundSettings({ ...soundSettings, repeatTimes: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
                >
                  <option value={1}>1 Time</option>
                  <option value={2}>2 Times (Recommended)</option>
                  <option value={3}>3 Times</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Voice Script Pattern</label>
              <input
                type="text"
                value={soundSettings.announcementFormat}
                onChange={e => setSoundSettings({ ...soundSettings, announcementFormat: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 font-mono text-slate-700"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Variables: {'{token}'}, {'{chamber}'}, {'{doctor}'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={testVoiceSample}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <Play className="w-3.5 h-3.5 text-teal-600" />
              Listen to Voice Preview
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-xs"
            >
              Save Audio Configuration
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: QUEUE RULES & PRIVACY */}
      {activeTab === 'rules' && queueRules && (
        <form onSubmit={handleSaveRules} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs space-y-6 max-w-2xl">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900">Patient Privacy & Queue Orchestration Rules</h2>
            <p className="text-xs text-slate-500">HIPAA compliant anonymization on public screens and skip thresholds</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Anonymization on Waiting Room Screens
              </label>
              <select
                value={queueRules.anonymizePatientNameOnDisplay}
                onChange={e => setQueueRules({ ...queueRules, anonymizePatientNameOnDisplay: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500 bg-white"
              >
                <option value="INITIALS_ONLY">Initials Only (e.g. "J. D." - Recommended for Privacy)</option>
                <option value="FULL_NAME">Full Name (Standard)</option>
                <option value="TOKEN_ONLY">Token Number Only (Strict Anonymity)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Minutes Per Patient
                </label>
                <input
                  type="number"
                  value={queueRules.estimatedMinutesPerPatient}
                  onChange={e => setQueueRules({ ...queueRules, estimatedMinutesPerPatient: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Auto Recalls Before Marking Skipped
                </label>
                <input
                  type="number"
                  value={queueRules.maxAutoRecalls}
                  onChange={e => setQueueRules({ ...queueRules, maxAutoRecalls: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={queueRules.priorityQueueForEmergency}
                  onChange={e => setQueueRules({ ...queueRules, priorityQueueForEmergency: e.target.checked })}
                  className="rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                />
                <span>Auto-elevate Emergency triage patients to the top of the consultation queue</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={queueRules.enableSmsTokenNotification}
                  onChange={e => setQueueRules({ ...queueRules, enableSmsTokenNotification: e.target.checked })}
                  className="rounded text-teal-600 border-slate-300 focus:ring-teal-500"
                />
                <span>Send SMS to patient 3 turns before their consultation token is dispatched</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-xs"
            >
              Save Queue Policy
            </button>
          </div>
        </form>
      )}

      {/* MODAL: LIVE DIGITAL TV SIMULATOR PREVIEW */}
      {selectedScreenForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-950 text-white rounded-2xl max-w-5xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
            {/* TV Header Bar */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedScreenForPreview.screenName}</h3>
                  <div className="text-[10px] text-teal-400">Pattern HMS Digital Waiting Room Signage • 1080p</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedScreenForPreview(null)}
                className="px-3 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                Close TV Simulation [ESC]
              </button>
            </div>

            {/* Simulated High-Contrast Hospital Display Screen */}
            <div className="p-6 bg-radial from-slate-900 to-slate-950 grid grid-cols-3 gap-6 min-h-[420px]">
              {/* Left 2 Cols: Currently Serving Tokens */}
              <div className="col-span-2 space-y-4">
                <div className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-500 animate-ping" /> NOW CALLING • PLEASE PROCEED TO CHAMBER
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {queueItems
                    .filter(q => q.status === 'CALLED' || q.status === 'IN_CONSULTATION')
                    .slice(0, 4)
                    .map(item => (
                      <div key={item.id} className="p-5 rounded-2xl bg-slate-900/90 border-2 border-teal-500 shadow-xl space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-3xl font-black font-mono text-teal-400 tracking-wider">
                            {item.tokenNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                            {item.status === 'CALLED' ? 'FLASHING' : 'SERVING'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate">
                          {queueRules?.anonymizePatientNameOnDisplay === 'INITIALS_ONLY'
                            ? item.patientName.split(' ').map(n => n[0]).join('. ')
                            : queueRules?.anonymizePatientNameOnDisplay === 'TOKEN_ONLY'
                            ? 'Patient In-Chamber'
                            : item.patientName}
                        </div>
                        <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 pt-1 border-t border-slate-800">
                          <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                          <span>{item.chamberName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{item.doctorName}</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right Col: Next in Line Tokens */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                    NEXT IN QUEUE
                  </div>
                  <div className="space-y-2.5">
                    {queueItems
                      .filter(q => q.status === 'WAITING')
                      .slice(0, 5)
                      .map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-slate-200 text-sm">{item.tokenNumber}</span>
                            <span className="text-xs text-slate-400 truncate max-w-[100px]">
                              {queueRules?.anonymizePatientNameOnDisplay === 'INITIALS_ONLY'
                                ? item.patientName.split(' ').map(n => n[0]).join('. ')
                                : item.patientName}
                            </span>
                          </div>
                          <span className="text-[11px] text-teal-400 font-medium">{item.chamberName}</span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Est. Waiting: 5-15 mins</span>
                  <span className="text-teal-400 font-bold">Live Synced</span>
                </div>
              </div>
            </div>

            {/* Marquee Ticker Footer */}
            <div className="bg-teal-950 border-t border-teal-800/50 p-3 text-xs text-teal-200 flex items-center overflow-hidden">
              <span className="font-bold uppercase tracking-wider text-teal-400 mr-3 flex-shrink-0">
                NOTICE:
              </span>
              <div className="truncate font-medium">
                {selectedScreenForPreview.marqueeText}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
