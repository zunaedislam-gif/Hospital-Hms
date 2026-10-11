/**
 * Pattern HMS - Public Waiting Room Display (TV Wall Board)
 * Designed for large wall monitors with high contrast, uncluttered layout,
 * live audio announcements in Bangla and English, real-time SSE token updates,
 * prayer break notices, and full-screen support.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Tv,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Moon,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Activity,
  HeartPulse,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { useLanguage } from '../../context/LanguageContext';
import { speakTokenAnnouncement } from '../reception/utils/speech';

export const WaitingRoomDisplayView: React.FC = () => {
  const { subscribe, isConnected } = useRealtime();
  const { language } = useLanguage();

  const [displayState, setDisplayState] = useState<{
    chambers: Array<{
      doctorId: string;
      doctorName: string;
      specialtyName: string;
      chamberNumber: string;
      chamberName: string;
      status: string;
      breakType?: string | null;
      expectedReturnTime?: string | null;
      breakNotes?: string | null;
      currentServingToken: string | null;
      currentServingStatus: string | null;
      lastCalledAt?: string | null;
      upcomingTokens: Array<{ tokenNumber: string; isEmergency: boolean; priority: string }>;
      waitingCount: number;
    }>;
    recentCalls: Array<{
      tokenNumber: string;
      doctorName?: string;
      chamberNumber: string;
      calledAt: string;
    }>;
    hospitalName: string;
    serverTime: string;
  }>({
    chambers: [],
    recentCalls: [],
    hospitalName: 'Pattern Central Hospital',
    serverTime: new Date().toISOString()
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastCalledAlert, setLastCalledAlert] = useState<{ token: string; chamber: string } | null>(null);

  // Live Clock Tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Display Feed
  const loadDisplayFeed = useCallback(async () => {
    try {
      const res = await api.display.getState();
      const stateData = (res as any)?.data || res;
      if (stateData && stateData.chambers) {
        setDisplayState(stateData);
      }
    } catch (err) {
      console.error('Failed to load display state', err);
    }
  }, []);

  useEffect(() => {
    loadDisplayFeed();
    const interval = setInterval(loadDisplayFeed, 10000);
    return () => clearInterval(interval);
  }, [loadDisplayFeed]);

  // Real-time Event Listener for Live Patient Calling
  useEffect(() => {
    const unsubCalled = subscribe('QUEUE_PATIENT_CALLED', (data: any) => {
      loadDisplayFeed();
      if (data && data.tokenNumber) {
        setLastCalledAlert({
          token: data.tokenNumber,
          chamber: data.chamberNumber || '101'
        });

        // Trigger Audio Chime and Voice Announcement
        if (audioEnabled) {
          speakTokenAnnouncement(data.tokenNumber, data.chamberNumber || '101', language);
        }

        setTimeout(() => setLastCalledAlert(null), 8000);
      }
    });

    const unsubDoctor = subscribe('DOCTOR_STATUS_CHANGED', () => loadDisplayFeed());
    const unsubBreak = subscribe('DOCTOR_ON_PRAYER_BREAK', () => loadDisplayFeed());
    const unsubResume = subscribe('DOCTOR_AVAILABLE', () => loadDisplayFeed());

    return () => {
      unsubCalled();
      unsubDoctor();
      unsubBreak();
      unsubResume();
    };
  }, [subscribe, loadDisplayFeed, audioEnabled, language]);

  // Toggle Browser Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none -m-6 p-6">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between border-b border-slate-800/80 pb-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Tv className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white tracking-tight uppercase">
                {displayState.hospitalName}
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                OUTPATIENT CHAMBER DISPLAY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live Serving Tokens • Please watch your token number and proceed to the indicated chamber
            </p>
          </div>
        </div>

        {/* Clock & Control Toggles */}
        <div className="flex items-center gap-4">
          {/* Live Digital Clock */}
          <div className="text-right">
            <div className="text-2xl font-mono font-black text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div className="text-xs font-semibold text-teal-400">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-3 rounded-xl border transition cursor-pointer ${
              audioEnabled
                ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 hover:bg-teal-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={audioEnabled ? 'Voice Chime Enabled' : 'Voice Chime Muted'}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Floating Active Calling Banner (When a token is actively called) */}
      {lastCalledAlert && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 border border-teal-300 shadow-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <Volume2 className="w-8 h-8 text-white animate-bounce" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-teal-100">
                PATIENT TOKEN ANNOUNCED
              </span>
              <div className="text-3xl font-black text-white">
                TOKEN #{lastCalledAlert.token} → PLEASE PROCEED TO CHAMBER {lastCalledAlert.chamber}
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-white/20 rounded-xl text-xs font-bold text-white uppercase tracking-wider">
            NOW SERVING
          </div>
        </div>
      )}

      {/* Main Chamber Display Grid */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayState.chambers.map(chamber => {
          const isOnPrayer = chamber.status === 'ON_PRAYER_BREAK';
          const isOnBreak = chamber.status === 'ON_BREAK' || isOnPrayer;

          return (
            <div
              key={chamber.doctorId}
              className={`rounded-3xl p-6 border flex flex-col justify-between transition relative overflow-hidden ${
                chamber.currentServingToken
                  ? 'bg-slate-900/90 border-teal-500/40 shadow-xl ring-1 ring-teal-500/20'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              {/* Chamber Number & Status Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="px-4 py-2 rounded-2xl bg-teal-500 text-slate-950 font-black text-lg tracking-tight">
                    ROOM {chamber.chamberNumber}
                  </div>

                  {/* Doctor Availability Pill */}
                  {isOnPrayer ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
                      <Moon className="w-3.5 h-3.5" />
                      <span>Prayer Break</span>
                      {chamber.expectedReturnTime && (
                        <span className="text-amber-200 ml-1">({chamber.expectedReturnTime})</span>
                      )}
                    </div>
                  ) : isOnBreak ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-bold">
                      <Coffee className="w-3.5 h-3.5" />
                      <span>On Break</span>
                      {chamber.expectedReturnTime && (
                        <span className="text-yellow-200 ml-1">({chamber.expectedReturnTime})</span>
                      )}
                    </div>
                  ) : chamber.currentServingToken ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>In Consultation</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
                      <span>Available / Idle</span>
                    </div>
                  )}
                </div>

                {/* Doctor Name & Specialty */}
                <div>
                  <h3 className="text-lg font-bold text-white">{chamber.doctorName}</h3>
                  <p className="text-xs text-teal-400 font-semibold mt-0.5">{chamber.specialtyName}</p>
                </div>
              </div>

              {/* Center: Massive Current Serving Token */}
              <div className="my-6 py-6 px-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  CURRENT TOKEN
                </div>
                {chamber.currentServingToken ? (
                  <div className="text-5xl font-black text-white tracking-wider font-mono text-teal-300 drop-shadow-sm">
                    {chamber.currentServingToken}
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-slate-600 italic py-2">
                    {isOnBreak ? 'Pause for Break' : 'Waiting Patient'}
                  </div>
                )}
              </div>

              {/* Bottom: Upcoming Next Tokens In Line */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>NEXT IN QUEUE</span>
                  <span className="text-teal-400">{chamber.waitingCount} Waiting</span>
                </div>

                <div className="flex items-center gap-2">
                  {chamber.upcomingTokens.length === 0 ? (
                    <span className="text-xs text-slate-600 italic">No waiting tokens</span>
                  ) : (
                    chamber.upcomingTokens.map((t, idx) => (
                      <div
                        key={idx}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                          t.isEmergency
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : 'bg-slate-800 border-slate-700 text-slate-200'
                        }`}
                      >
                        {t.tokenNumber}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Bottom Ticker / News Bar */}
      <footer className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 font-bold uppercase text-[10px]">
            ANNOUNCEMENT
          </span>
          <span>
            Please retain your printed token receipt. When your token number is displayed, enter the designated chamber immediately.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-300">System Connected</span>
        </div>
      </footer>
    </div>
  );
};
