/**
 * @file AppPublicShell.tsx
 * @description
 * Enterprise-quality shell for unauthenticated pages (Home, Login, LogoutSuccess).
 * Thin orchestrator delegating to header, content, and toast components.
 * Minimal header with language toggle and dark/light theme switcher.
 * No sidebar, no user profile, no navigation menu.
 *
 * @enterprise
 * - Clean, professional header suitable for public-facing pages
 * - Language toggle (🇩🇪/🇺🇸) persists in localStorage and syncs with i18next
 * - Dark/light theme toggle with localStorage persistence
 * - Toast context for lightweight notifications
 * - Responsive design (mobile-friendly)
 * - Full-width content area with proper spacing
 *
 * @routing
 * Unauthenticated routes render as <Outlet /> within the content area.
 * Examples: /home, /login, /logout-success
 *
 * @example
 * ```tsx
 * <AppPublicShell />
 * ```
 */
import * as React from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ToastContext } from '../../context/toast';
import { buildTheme } from '../../theme';
import { useThemeMode, useLocale, usePublicShellToast } from './hooks';
import { PublicShellHeader } from './header';
import PublicShellContent from './PublicShellContent';
import PublicShellToastContainer from './PublicShellToastContainer';

/**
 * AppPublicShell component (thin orchestrator)
 * Manages state and delegates to sub-components
 *
 * @returns Public shell layout with header, content, and toast notifications
 */
const AppPublicShell: React.FC = () => {
  const { i18n, t } = useTranslation('common');

  // State management via custom hooks
  const { themeMode, toggleThemeMode } = useThemeMode();
  const { locale, toggleLocale } = useLocale(i18n);
  const { toast, showToast, hideToast, setToast } = usePublicShellToast();

  // Build theme based on locale and theme mode
  const theme = React.useMemo(() => buildTheme(locale, themeMode), [locale, themeMode]);

  /**
   * Handle language toggle with toast notification
   */
  const handleToggleLocale = () => {
    toggleLocale();
    showToast(
      locale === 'de' ? 'Sprache: Deutsch' : 'Language: English',
      'info'
    );
  };

  /**
   * Handle theme toggle with toast notification
   */
  const handleToggleThemeMode = () => {
    toggleThemeMode();
    showToast(
      themeMode === 'light' ? 'Dark mode enabled' : 'Light mode enabled',
      'info'
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContext.Provider
        value={(msg, severity = 'success') => setToast({ open: true, msg, severity })}
      >
        {/* Main layout container */}
        <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
          {/* Fixed header */}
          <PublicShellHeader
            appTitle={t('app.title')}
            themeMode={themeMode}
            onThemeToggle={handleToggleThemeMode}
            locale={locale}
            onLocaleToggle={handleToggleLocale}
            languageTooltip={t('actions.toggleLanguage')}
          />

          {/* Main content area */}
          <PublicShellContent />

          {/* Toast notifications */}
          <PublicShellToastContainer toast={toast} onClose={hideToast} />
        </Box>
      </ToastContext.Provider>
    </ThemeProvider>
  );
};

export default AppPublicShell;
