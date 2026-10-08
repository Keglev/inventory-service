/**
 * @file useShellSettings.ts
 * @module app/layout/useShellSettings
 *
 * @summary
 * Adapter over ShellPreferencesProvider for the settings dialog: exposes locale
 * and theme mode, and wraps the setters with the app shell's toasts.
 *
 * @enterprise
 * - State lives in ShellPreferencesProvider (FW5 fork 4); this hook adds only
 *   what the authenticated shell does on top: a toast per change, and the rule
 *   that re-selecting the current theme mode stays silent.
 * - Toasts go through useToast (AppShell's ToastContext), so the hook works
 *   anywhere inside the shell without a callback being passed down.
 */

import { useTranslation } from 'react-i18next';
import type { SupportedLocale } from '../../theme';
import { useShellPreferences } from '../../hooks/useShellPreferences';
import type { ThemeMode } from '../../context/shellPreferences/ShellPreferencesContext.types';
import { useToast } from '../../context/toast/ToastContext';

/** State and change handlers for the settings dialog. */
export interface ShellSettings {
  /** Current UI language. */
  locale: SupportedLocale;
  /** Current colour scheme. */
  themeMode: ThemeMode;
  /** Switches the colour scheme and toasts; silent when the mode is already active. */
  handleThemeModeChange: (nextMode: ThemeMode) => void;
  /** Switches the language and toasts once i18next has switched. */
  handleLocaleChange: (next: SupportedLocale) => Promise<void>;
}

/**
 * Binds the shared preferences to the app shell's toasts.
 *
 * @returns locale, theme mode and the two change handlers
 */
export function useShellSettings(): ShellSettings {
  const { t } = useTranslation(['common']);
  const notify = useToast();
  const { locale, themeMode, setLocale, setThemeMode } = useShellPreferences();

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

  return { locale, themeMode, handleThemeModeChange, handleLocaleChange };
}
