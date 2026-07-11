/**
 * @file useShellSettings.ts
 * @module app/layout/useShellSettings
 *
 * @summary
 * Owns the app shell's theme-mode and locale state, their localStorage
 * persistence, the MUI theme object, and the i18n language sync. Extracted
 * from AppShell to keep that file a thin orchestrator.
 *
 * @enterprise
 * - Single source of truth for themeMode and locale; AppShell consumes the
 *   returned state and callbacks and wires them to sub-components.
 * - localStorage persistence lives here so no child needs storage access.
 * - Toast emission is delegated via the injected `notify` callback so this hook
 *   does not own UI surface; AppShell keeps the single Snackbar instance.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { buildTheme } from '../../theme';
import type { SupportedLocale } from '../../theme';

/* LocalStorage keys for persistence */
const LS_THEME_KEY = 'themeMode';
const LS_LANGUAGE_KEY = 'i18nextLng';

/** Normalize an i18n language tag ('de-DE', 'en-US') to a SupportedLocale ('de' | 'en'). */
function normalizeLocale(lng?: string): SupportedLocale {
  return lng?.startsWith('en') ? 'en' : 'de';
}

type Notify = (msg: string, severity: 'success' | 'info' | 'warning' | 'error') => void;

export interface ShellSettings {
  locale: SupportedLocale;
  themeMode: 'light' | 'dark';
  theme: ReturnType<typeof buildTheme>;
  handleThemeModeChange: (nextMode: 'light' | 'dark') => void;
  handleLocaleChange: (next: SupportedLocale) => void;
}

export function useShellSettings(notify: Notify): ShellSettings {
  const { t, i18n } = useTranslation(['common', 'auth']);

  // Initialize locale from localStorage or i18n default; keep state synced to i18n changes.
  const initial = normalizeLocale(localStorage.getItem(LS_LANGUAGE_KEY) || i18n.resolvedLanguage || 'de');
  const [locale, setLocale] = React.useState<SupportedLocale>(initial);

  React.useEffect(() => {
    const handler = (lng: string) => setLocale(normalizeLocale(lng));
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, [i18n]);

  // Initialize theme mode from localStorage; default 'light'.
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(LS_THEME_KEY) as 'light' | 'dark' | null;
    return saved || 'light';
  });

  // Rebuild the MUI theme when locale or themeMode changes.
  const theme = React.useMemo(() => buildTheme(locale, themeMode), [locale, themeMode]);

  const handleThemeModeChange = (nextMode: 'light' | 'dark') => {
    setThemeMode((prev) => {
      if (prev === nextMode) {
        return prev;
      }
      localStorage.setItem(LS_THEME_KEY, nextMode);
      notify(
        nextMode === 'dark'
          ? t('common:shell.darkModeEnabled')
          : t('common:shell.lightModeEnabled'),
        'info'
      );
      return nextMode;
    });
  };

  const handleLocaleChange = (next: SupportedLocale) => {
    localStorage.setItem(LS_LANGUAGE_KEY, next);
    setLocale(next);
    i18n.changeLanguage(next);
    // Resolve in the language just selected so the toast names the new language.
    notify(t('common:shell.languageChanged', { lng: next }), 'info');
  };

  return { locale, themeMode, theme, handleThemeModeChange, handleLocaleChange };
}
