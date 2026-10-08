/**
 * @file AppPublicShell.tsx
 * @module AppPublicShell
 * @summary Thin orchestrator for unauthenticated routes; applies the shared theme,
 * owns the toast state, and delegates render to header, content, and toast
 * sub-components.
 *
 * @enterprise
 * - Mounted by AppRouter as the route element for unauthenticated paths (/home,
 *   /login, /logout-success); no sidebar or nav by design — public pages need none.
 * - Reads locale, themeMode and the MUI theme from ShellPreferencesProvider
 *   (shared with AppShell, FW5 fork 4) and owns only the toast state
 *   (usePublicShellToast); children remain stateless.
 * - Re-uses the shared ToastContext so page-level code triggers toasts without
 *   knowing which shell is currently active.
 *
 * @example
 * ```tsx
 * <AppPublicShell />
 * ```
 */
import * as React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ToastContext } from '../../context/toast/ToastContext';
import { useShellPreferences } from '../../hooks/useShellPreferences';
import { usePublicShellToast } from './hooks/usePublicShellToast';
import PublicShellHeader from './header/PublicShellHeader';
import PublicShellContent from './PublicShellContent';
import PublicShellToastContainer from './PublicShellToastContainer';
import { default as AppFooter } from '../footer/AppFooter';
import HelpPanel from '../../components/help/HelpPanel';

const AppPublicShell: React.FC = () => {
  const { t } = useTranslation('common');
  const { locale, themeMode, theme, setLocale, setThemeMode } = useShellPreferences();
  const { toast, showToast, hideToast, setToast } = usePublicShellToast();

  const handleToggleLocale = async () => {
    await setLocale(locale === 'de' ? 'en' : 'de');
    // Resolved after the switch: `t` is bound to no fixed language, so it
    // answers in the one now active, with its bundle guaranteed loaded.
    showToast(t('shell.languageChanged'), 'info');
  };

  const handleToggleThemeMode = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
    showToast(
      themeMode === 'light'
        ? t('shell.darkModeEnabled')
        : t('shell.lightModeEnabled'),
      'info'
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContext.Provider
        value={(msg, severity = 'success') => setToast({ open: true, msg, severity })}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', bgcolor: 'background.default', minHeight: '100vh' }}>
          <PublicShellHeader
            appTitle={t('app.title')}
            themeMode={themeMode}
            onThemeToggle={handleToggleThemeMode}
            locale={locale}
            onLocaleToggle={handleToggleLocale}
            languageTooltip={t('actions.toggleLanguage')}
          />

          <PublicShellContent />

          <AppFooter />

          {/* Help drawer — inside the ThemeProvider so it follows light/dark mode */}
          <HelpPanel />

          <PublicShellToastContainer toast={toast} onClose={hideToast} />
        </Box>
      </ToastContext.Provider>
    </ThemeProvider>
  );
};

export default AppPublicShell;
