/**
 * @file ShellPreferencesContext.tsx
 * @module context/shellPreferences/ShellPreferencesContext
 *
 * @summary
 * Provider that owns the UI language and the colour scheme for both shells
 * (public and authenticated) and builds the MUI theme from them.
 *
 * @enterprise
 * - One owner instead of two copied hooks (useLocale/useThemeMode in the public
 *   shell, useShellSettings in the app shell); FW5 fork 4, finding A-R1.
 * - Persistence keys are unchanged: the language shares i18next's detector key
 *   (LANGUAGE_KEY), so the German-first seed in i18n/index.ts still decides the
 *   first visit.
 * - The provider renders no ThemeProvider: each shell keeps applying the theme,
 *   so routes outside the shells look exactly as before.
 * - Toasts stay with the shells; this layer only changes state.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { buildTheme, type SupportedLocale } from '../../theme';
import { LANGUAGE_KEY, THEME_MODE_KEY } from '../../config/storageKeys';
import {
  ShellPreferencesContext,
  type ShellPreferences,
  type ThemeMode,
} from './ShellPreferencesContext.types';

const normalizeLocale = (lng?: string): SupportedLocale => (lng?.startsWith('en') ? 'en' : 'de');

// WHY: only 'dark' selects dark; anything else stored under the key falls back
// to the light default instead of reaching buildTheme as an unknown mode.
const readStoredThemeMode = (): ThemeMode =>
  localStorage.getItem(THEME_MODE_KEY) === 'dark' ? 'dark' : 'light';

/** Mount once above the router so both shells read the same state. */
export function ShellPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  const [locale, setLocaleState] = React.useState<SupportedLocale>(() =>
    normalizeLocale(localStorage.getItem(LANGUAGE_KEY) || i18n.resolvedLanguage || 'de'),
  );
  const [themeMode, setThemeModeState] = React.useState<ThemeMode>(readStoredThemeMode);

  // WHY: language can also change outside this provider (the detector, a test
  // harness); following the event keeps state and i18next in step.
  React.useEffect(() => {
    const handler = (lng: string) => setLocaleState(normalizeLocale(lng));
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, [i18n]);

  const setLocale = React.useCallback(
    async (next: SupportedLocale): Promise<void> => {
      localStorage.setItem(LANGUAGE_KEY, next);
      setLocaleState(next);
      await i18n.changeLanguage(next);
    },
    [i18n],
  );

  const setThemeMode = React.useCallback((mode: ThemeMode) => {
    localStorage.setItem(THEME_MODE_KEY, mode);
    setThemeModeState(mode);
  }, []);

  const theme = React.useMemo(() => buildTheme(locale, themeMode), [locale, themeMode]);

  const value = React.useMemo<ShellPreferences>(
    () => ({ locale, themeMode, theme, setLocale, setThemeMode }),
    [locale, themeMode, theme, setLocale, setThemeMode],
  );

  return <ShellPreferencesContext.Provider value={value}>{children}</ShellPreferencesContext.Provider>;
}
