/**
 * Pattern HMS - Localization Hub & Utilities
 */
import { Language, TranslationSchema } from './types';
import { en } from './en';
import { bn } from './bn';

export * from './types';
export { en, bn };

export const translations: Record<Language, TranslationSchema> = {
  en,
  bn
};

const BENGALI_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯'
};

const ENGLISH_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9'
};

/**
 * Converts numbers or strings with digits to Bengali numerals if target is 'bn'
 */
export function toBengaliDigits(input: number | string): string {
  const str = String(input);
  return str.replace(/[0-9]/g, digit => BENGALI_DIGITS[digit] || digit);
}

/**
 * Converts Bengali digits back to English
 */
export function toEnglishDigits(input: string): string {
  return input.replace(/[০-৯]/g, digit => ENGLISH_DIGITS[digit] || digit);
}

/**
 * Format numbers according to active language
 */
export function formatLocalizedNumber(value: number | string, language: Language): string {
  if (value === null || value === undefined || value === '') return '';
  if (language === 'bn') {
    return toBengaliDigits(value);
  }
  return String(value);
}

/**
 * Format monetary currency values nicely with locale symbol
 */
export function formatLocalizedCurrency(
  amount: number,
  language: Language,
  currencyCode = 'BDT'
): string {
  const formattedNumber = new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);

  if (currencyCode === 'BDT' || (!currencyCode && language === 'bn')) {
    return language === 'bn' ? `৳ ${formattedNumber}` : `BDT ${formattedNumber}`;
  }
  if (currencyCode === 'USD') {
    return language === 'bn' ? `$ ${formattedNumber}` : `$${formattedNumber}`;
  }
  return `${currencyCode} ${formattedNumber}`;
}
