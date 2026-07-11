/**
 * @file useLocale.ts
 * @module useLocale
 * @summary Manages locale state (de/en) with localStorage and i18next synchronization.
 *
 * @enterprise
 * - Uses LS key 'i18nextLng' — the same key i18next writes natively — so this hook
 *   and i18next always read from the same source of truth.
 * - Normalizes regional codes (e.g. 'de-DE' -> 'de') because browsers and OS settings
 *   often produce BCP-47 regional variants that the theme's SupportedLocale doesn't
 *   accept.
 * - Subscribes to i18next 'languageChanged' so locale state stays consistent when
 *   i18next changes language from outside this hook.
 *
 * @example
 * ```tsx
 * const { locale, changeLocale, toggleLocale } = useLocale(i18n);
 * ```
 */
import * as React from 'react';
import type { i18n } from 'i18next';
import type { SupportedLocale } from '../../../theme';

const LS_KEY = 'i18nextLng';

const normalize = (lng?: string): SupportedLocale => (lng?.startsWith('en') ? 'en' : 'de');

interface UseLocaleReturn {
  locale: SupportedLocale;
  changeLocale: (locale: SupportedLocale) => void;
  toggleLocale: () => void;
}

export const useLocale = (i18n: i18n): UseLocaleReturn => {
  const initial = normalize(localStorage.getItem(LS_KEY) || i18n.resolvedLanguage || 'de');
  const [locale, setLocaleState] = React.useState<SupportedLocale>(initial);

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
