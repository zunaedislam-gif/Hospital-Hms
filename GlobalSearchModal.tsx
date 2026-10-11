/**
 * Pattern HMS - Global Cross-Entity Command Palette Search
 * Fully Multilingual (English / বাংলা)
 */
import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, User, Stethoscope, FileText, Network, X, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { NavigationTab } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { isBangla, tObj } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.globalSearch(query);
        setResults(res);
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (tab: NavigationTab) => {
    onNavigate(tab);
    onClose();
  };

  const totalResults = results
    ? (results.organizations?.length || 0) +
      (results.doctors?.length || 0) +
      (results.users?.length || 0) +
      (results.tests?.length || 0) +
      (results.departments?.length || 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isBangla
                ? 'হাসপাতাল, ডাক্তার, প্যাথলজি টেস্ট, স্টাফ বা বিভাগ অনুসন্ধান করুন... (Esc বন্ধ করতে)'
                : 'Search hospitals, doctors, diagnostic tests, staff, departments... (Esc to close)'
            }
            className="w-full text-base bg-transparent border-0 focus:outline-hidden text-slate-800 placeholder:text-slate-400"
          />
          {isSearching && <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results area */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center text-slate-400 text-sm">
              <p>
                {isBangla ? (
                  <span>
                    অনুসন্ধানের জন্য কীওয়ার্ড লিখুন: যেমন <span className="text-slate-600 font-medium">"Rahman"</span>, <span className="text-slate-600 font-medium">"CBC"</span>, <span className="text-slate-600 font-medium">"Central Hospital"</span> বা <span className="text-slate-600 font-medium">"Cardiology"</span>
                  </span>
                ) : (
                  <span>
                    Type keywords like <span className="text-slate-600 font-medium">"Rahman"</span>, <span className="text-slate-600 font-medium">"CBC"</span>, <span className="text-slate-600 font-medium">"Central Hospital"</span>, or <span className="text-slate-600 font-medium">"Cardiology"</span>
                  </span>
                )}
              </p>
            </div>
          )}

          {query && totalResults === 0 && !isSearching && (
            <div className="py-8 text-center text-slate-500 text-sm">
              {isBangla ? (
                <span><span className="font-semibold text-slate-700">"{query}"</span> এর সাথে কোনো মিল পাওয়া যায়নি।</span>
              ) : (
                <span>No matching healthcare entities found for <span className="font-semibold text-slate-700">"{query}"</span>.</span>
              )}
            </div>
          )}

          {results?.organizations?.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span>{isBangla ? 'হাসপাতাল ও ডায়াগনস্টিক সেন্টার' : 'Hospitals & Diagnostic Centers'}</span>
                <button onClick={() => handleSelect('organizations')} className="text-teal-600 hover:underline flex items-center gap-1 text-[11px] cursor-pointer">
                  {isBangla ? 'সব দেখুন' : 'View all'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {results.organizations.map((org: any) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelect('organizations')}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-teal-50 text-teal-600">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 group-hover:text-teal-700">{org.title}</div>
                        <div className="text-xs text-slate-500">{org.subtitle}</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-slate-600">{isBangla ? 'পরিদর্শন' : 'Inspect'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results?.doctors?.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span>{isBangla ? 'কনসালটেন্ট ও ডাক্তার' : 'Medical Consultants & Doctors'}</span>
                <button onClick={() => handleSelect('clinical')} className="text-teal-600 hover:underline flex items-center gap-1 text-[11px] cursor-pointer">
                  {isBangla ? 'সব দেখুন' : 'View all'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {results.doctors.map((doc: any) => (
                  <button
                    key={doc.id}
                    onClick={() => handleSelect('clinical')}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-sky-50 text-sky-600">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 group-hover:text-sky-700">{doc.title}</div>
                        <div className="text-xs text-slate-500">{doc.subtitle}</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-slate-600">{isBangla ? 'কনসালটেন্ট' : 'Consultant'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results?.tests?.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span>{isBangla ? 'ডায়াগনস্টিক টেস্ট ও ল্যাব' : 'Diagnostic Tests & Laboratory'}</span>
                <button onClick={() => handleSelect('diagnostics')} className="text-teal-600 hover:underline flex items-center gap-1 text-[11px] cursor-pointer">
                  {isBangla ? 'ক্যাটালগ দেখুন' : 'View catalog'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {results.tests.map((test: any) => (
                  <button
                    key={test.id}
                    onClick={() => handleSelect('diagnostics')}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-purple-50 text-purple-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 group-hover:text-purple-700">{test.title}</div>
                        <div className="text-xs text-slate-500">{test.subtitle}</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-slate-600">{isBangla ? 'কোড' : 'Test Code'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results?.users?.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <span>{isBangla ? 'কর্মকর্তা ও সিস্টেম ইউজার' : 'Staff & System Users'}</span>
                <button onClick={() => handleSelect('users')} className="text-teal-600 hover:underline flex items-center gap-1 text-[11px] cursor-pointer">
                  {isBangla ? 'ডিরেক্টরি' : 'View directory'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="space-y-1">
                {results.users.map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelect('users')}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 group-hover:text-emerald-700">{u.title}</div>
                        <div className="text-xs text-slate-500">{u.subtitle}</div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-slate-600">{isBangla ? 'স্টাফ' : 'Staff'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {results?.departments?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {isBangla ? 'ক্লিনিক্যাল ডিপার্টমেন্ট' : 'Clinical Departments'}
              </div>
              <div className="space-y-1">
                {results.departments.map((dept: any) => (
                  <button
                    key={dept.id}
                    onClick={() => handleSelect('clinical')}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 group transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                        <Network className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 group-hover:text-indigo-700">{dept.title}</div>
                        <div className="text-xs text-slate-500">{dept.subtitle}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            {isBangla ? 'টিপস: বন্ধ করতে ' : 'Tip: Press '}
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded-sm font-mono text-slate-700">Esc</kbd>
            {isBangla ? ' চাপুন' : ' to exit search'}
          </span>
          <span>{isBangla ? 'দ্রুত ইনডেক্সিং সিস্টেম' : 'Fast enterprise directory indexing'}</span>
        </div>
      </div>
    </div>
  );
};
