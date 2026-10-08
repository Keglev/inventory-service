/**
 * @file useShellSettings.ts
 * @module app/layout/useShellSettings
 *
 * @summary
 * App-shell adapter over ShellPreferencesProvider: exposes locale, theme mode
 * and the MUI theme, and wraps the setters with the shell's toasts.
 *
 * @enterprise
 * - State lives in ShellPreferencesProvider (FW5 fork 4); this hook adds only
 *   what the authenticated shell does on top: a toast per change, and the rule
 *   that re-selecting the current theme mode stays silent.
 * - Toast emission is delegated via the injected `notify` callback so AppShell
 *   keeps the single Snackbar instance.
 */

import { useTranslation } from 'react-i18next';
import type { SupportedLocale } from '../../theme';
import { useShellPreferences } from '../../hooks/useShellPreferences';
import type { ShellPreferences, ThemeMode } from '../../context/shellPreferences/ShellPreferencesContext.types';

type Notify = (msg: string, severity: 'success' | 'info' | 'warning' | 'error') => void;

/** State and change handlers returned to AppShell. */
export interface ShellSettings {
  /** Current UI language. */
  locale: SupportedLocale;
  /** Current colour scheme. */
  themeMode: ThemeMode;
  /** MUI theme for the shell's ThemeProvider. */
  theme: ShellPreferences['theme'];
  /** Switches the colour scheme and toasts; silent when the mode is already active. */
  handleThemeModeChange: (nextMode: ThemeMode) => void;
  /** Switches the language and toasts once i18next has switched. */
  handleLocaleChange: (next: SupportedLocale) => Promise<void>;
}

/**
 * Binds the shared preferences to the app shell's toasts.
 *
 * @param notify - AppShell's toast callback
 * @returns locale, theme mode, theme and the two change handlers
 */
export function useShellSettings(notify: Notify): ShellSettings {
  const { t } = useTranslation(['common', 'auth']);
  const { locale, themeMode, theme, setLocale, setThemeMode } = useShellPreferences();

  const handleThemeModeChange = (nextMode: ThemeMode) => {
    if (nextMode === themeMode) {
      return;
    }
    setThemeMode(nextMode);
    notify(
      nextMode === 'dark'
        ? t('common:shell.darkModeEnabled')
        : t('common:shell.lightModeEnabled'),
      'info'
    );
  };

  const handleLocaleChange = async (next: SupportedLocale): Promise<void> => {
    await setLocale(next);
    notify(t('common:shell.languageChanged'), 'info');
  };

  return { locale, themeMode, theme, handleThemeModeChange, handleLocaleChange };
}
