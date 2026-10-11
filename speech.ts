/**
 * Pattern HMS - Audio Token Announcement Utility
 * Uses HTML5 SpeechSynthesis API for announcing tokens across the hospital lobby.
 * Supports both English and Bangla (বাংলা).
 */
import { toBengaliDigits } from '../../../i18n';

export function announceToken(
  tokenNumber: string,
  chamberNumber: string,
  patientName?: string,
  languagePreference?: 'en' | 'bn'
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser environment.');
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterances

    // Determine language (passed explicitly or retrieved from storage/document)
    let currentLang = languagePreference;
    if (!currentLang) {
      const stored = localStorage.getItem('pattern_hms_lang');
      currentLang = stored === 'bn' ? 'bn' : 'en';
    }

    const isBangla = currentLang === 'bn';
    const text = isBangla
      ? `টোকেন নম্বর ${toBengaliDigits(tokenNumber)}। অনুগ্রহ করে চেম্বার ${toBengaliDigits(chamberNumber)}-এ আসুন।`
      : `Token number ${tokenNumber}. Please proceed to Chamber ${chamberNumber}.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.lang = isBangla ? 'bn-BD' : 'en-US';

    // Try finding appropriate language voice
    const voices = window.speechSynthesis.getVoices();
    if (isBangla) {
      const banglaVoice = voices.find(v => v.lang.startsWith('bn') || v.lang.includes('Bengali') || v.name.includes('Bangla'));
      if (banglaVoice) {
        utterance.voice = banglaVoice;
      }
    } else {
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Female')));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Audio announcement failed:', err);
  }
}

export const speakTokenAnnouncement = announceToken;

