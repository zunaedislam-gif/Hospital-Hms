/**
 * Pattern HMS - Bilingual Language Selector (English / বাংলা)
 */
import React, { useState, useRef, useEffect } from 'react';
import { Languages, Check, Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n';

interface LanguageSelectorProps {
  variant?: 'pill' | 'dropdown' | 'compact';
  theme?: 'light' | 'dark';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'pill',
  theme = 'light',
  className = ''
}) => {
  const { language, setLanguage, isBangla } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languagesList: { code: Language; label: string; nativeLabel: string }[] = [
    { code: 'en', label: 'English', nativeLabel: 'English (US)' },
    { code: 'bn', label: 'Bangla', nativeLabel: 'বাংলা (বাংলাদেশ)' }
  ];

  // Segmented Pill Variant (Perfect for top bar and forms)
  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-lg border transition-all ${
          theme === 'dark'
            ? 'bg-slate-800/80 border-slate-700/80 text-slate-300 shadow-inner'
            : 'bg-slate-100/90 border-slate-200/80 text-slate-700 shadow-2xs'
        } ${className}`}
        role="group"
        aria-label="Language selection"
      >
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
            language === 'en'
              ? theme === 'dark'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-teal-800 shadow-xs border border-slate-200/60 font-bold'
              : theme === 'dark'
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Switch to English"
        >
          <span>EN</span>
        </button>

        <button
          type="button"
          onClick={() => setLanguage('bn')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
            language === 'bn'
              ? theme === 'dark'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-teal-800 shadow-xs border border-slate-200/60 font-bold'
              : theme === 'dark'
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="বাংলায় পরিবর্তন করুন"
        >
          <span>বাংলা</span>
        </button>
      </div>
    );
  }

  // Compact Icon + Pill
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
          theme === 'dark'
            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
        } ${className}`}
        title={isBangla ? 'Switch to English' : 'বাংলা ভাষায় পরিবর্তন করুন'}
      >
        <Globe className="w-3.5 h-3.5 text-teal-500" />
        <span>{isBangla ? 'বাং' : 'EN'}</span>
      </button>
    );
  }

  // Dropdown Variant
  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition shadow-2xs ${
          theme === 'dark'
            ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-teal-600" />
        <span className="font-semibold">{language === 'bn' ? 'বাংলা' : 'English'}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-1.5 w-44 rounded-xl shadow-xl border py-1.5 z-50 animate-in fade-in-50 zoom-in-95 ${
            theme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            {isBangla ? 'ভাষা নির্বাচন' : 'Select Language'}
          </div>

          {languagesList.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs flex items-center justify-between transition ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-teal-900/40 text-teal-300 font-semibold'
                      : 'bg-teal-50 text-teal-900 font-semibold'
                    : theme === 'dark'
                    ? 'hover:bg-slate-700 text-slate-300'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium text-xs">{lang.nativeLabel}</div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-teal-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
