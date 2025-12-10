/**
 * @file useLocale.ts
 * @description
 * Custom hook for managing locale (de/en) with localStorage and i18n synchronization.
 * Keeps locale state in sync with i18next language changes.
 *
 * @enterprise
 * - localStorage persistence key: 'i18nextLng'
 * - Synchronizes with i18next 'languageChanged' event
 * - Normalizes language codes (e.g., 'de-DE' -> 'de', 'en-US' -> 'en')
 * - Provides toggle function for language switching
 * - Automatic i18n changeLanguage calls
 *
 * @example
 * ```tsx
 * const { locale, changeLocale, toggleLocale } = useLocale(i18n);
 * ```
 *
 * @param i18n - i18next instance for language change integration
 * @returns Object with locale state, change function, and toggle function
 */
import * as React from 'react';
import type { i18n } from 'i18next';
import type { SupportedLocale } from '../../../theme';

const LS_KEY = 'i18nextLng';

/**
 * Normalize i18n language code to SupportedLocale
 * Examples: 'de-DE' -> 'de', 'en-US' -> 'en'
 */
const normalize = (lng?: string): SupportedLocale => (lng?.startsWith('en') ? 'en' : 'de');

interface UseLocaleReturn {
  /** Current locale */
  locale: SupportedLocale;
  /** Change locale and trigger i18n language change */
  changeLocale: (locale: SupportedLocale) => void;
  /** Toggle between de and en */
  toggleLocale: () => void;
}

/**
 * useLocale hook
 * @param i18n - i18next instance
 * @returns Locale state and control functions
 */
export const useLocale = (i18n: i18n): UseLocaleReturn => {
  const initial = normalize(localStorage.getItem(LS_KEY) || i18n.resolvedLanguage || 'de');
  const [locale, setLocaleState] = React.useState<SupportedLocale>(initial);

  // Keep locale state in sync with i18n language changes
  React.useEffect(() => {
    const handler = (lng: string) => setLocaleState(normalize(lng));
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, [i18n]);

  const changeLocale = (next: SupportedLocale) => {
    localStorage.setItem(LS_KEY, next);
    setLocaleState(next);
    i18n.changeLanguage(next);
  };

  const toggleLocale = () => {
    const next: SupportedLocale = locale === 'de' ? 'en' : 'de';
    changeLocale(next);
  };

  return { locale, changeLocale, toggleLocale };
};
