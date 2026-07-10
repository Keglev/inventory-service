/**
 * @file AppPublicShell.tsx
 * @module AppPublicShell
 * @summary Thin orchestrator for unauthenticated routes; owns theme, locale, and
 * toast state; builds the MUI theme from (locale, themeMode); delegates render to
 * header, content, and toast sub-components.
 *
 * @enterprise
 * - Mounted by AppRouter as the route element for unauthenticated paths (/home,
 *   /login, /logout-success); no sidebar or nav by design — public pages need none.
 * - Owns themeMode (useThemeMode), locale (useLocale), and toast
 *   (usePublicShellToast) state; derives and passes values down so children remain
 *   stateless.
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
import { buildTheme } from '../../theme';
import { useThemeMode } from './hooks/useThemeMode';
import { useLocale } from './hooks/useLocale';
import { usePublicShellToast } from './hooks/usePublicShellToast';
import PublicShellHeader from './header/PublicShellHeader';
import PublicShellContent from './PublicShellContent';
import PublicShellToastContainer from './PublicShellToastContainer';
import { default as AppFooter } from '../footer/AppFooter';
import HelpPanel from '../../components/help/HelpPanel';

const AppPublicShell: React.FC = () => {
  const { i18n, t } = useTranslation('common');

  const { themeMode, toggleThemeMode } = useThemeMode();
  const { locale, toggleLocale } = useLocale(i18n);
  const { toast, showToast, hideToast, setToast } = usePublicShellToast();

  const theme = React.useMemo(() => buildTheme(locale, themeMode), [locale, themeMode]);

  const handleToggleLocale = () => {
    toggleLocale();
    // Resolve in the language just selected so the toast names the new language.
    showToast(t('shell.languageChanged', { lng: locale === 'de' ? 'de' : 'en' }), 'info');
  };

  const handleToggleThemeMode = () => {
    toggleThemeMode();
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

          {/* Help drawer — inside the ThemeProvider so it follows light/dark mode (CB-APP83) */}
          <HelpPanel />

          <PublicShellToastContainer toast={toast} onClose={hideToast} />
        </Box>
      </ToastContext.Provider>
    </ThemeProvider>
  );
};

export default AppPublicShell;
