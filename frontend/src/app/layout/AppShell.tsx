/**
 * @file AppShell.tsx
 * @module app/layout/AppShell
 *
 * @summary
 * Thin orchestrator managing application shell state and layout coordination.
 * Delegates rendering to focused sub-components (header, sidebar, main).
 *
 * @enterprise
 * - Single source of truth for theme, locale, and drawer state
 * - Coordinates state flow between header, sidebar, and main content
 * - Manages localStorage persistence for theme and locale preferences
 * - Session timeout enforcement and health check monitoring
 * - Clean separation: orchestration vs. rendering logic
 */

import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSessionTimeout } from '../../features/auth';
import { ToastContext } from '../../context/toast';
import { buildTheme } from '../../theme';
import type { SupportedLocale } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { AppSettingsDialog } from '../settings';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import AppMain from './AppMain';
import { getHelpTopicForRoute } from './navConfig';

/* LocalStorage keys for persistence */
const LS_THEME_KEY = 'themeMode';
const LS_LANGUAGE_KEY = 'i18nextLng';

/**
 * Normalize i18n language string to SupportedLocale enum.
 *
 * Converts language tags like 'de-DE' or 'en-US' to simple 'de' or 'en'.
 *
 * @param lng - Language string from i18n or localStorage
 * @returns Normalized locale ('de' or 'en')
 */
function normalizeLocale(lng?: string): SupportedLocale {
  return lng?.startsWith('en') ? 'en' : 'de';
}

/**
 * Application shell component.
 *
 * Manages layout state and renders fixed AppBar, responsive Drawer,
 * and main content area. Coordinates:
 * - Theme mode (light/dark) with localStorage persistence
 * - Locale selection (de/en) with i18n integration
 * - Mobile drawer toggle
 * - Session timeout monitoring
 * - Health status checking
 * - Toast notifications
 * - Settings dialog
 *
 * Authenticated pages render inside this shell via <Outlet />.
 *
 * @returns JSX element rendering the application shell layout
 */
export default function AppShell() {
  const { i18n } = useTranslation(['common', 'auth']);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isDemo = Boolean(user?.isDemo);

  // Get current help topic based on route
  const helpTopic = getHelpTopicForRoute(location.pathname);

  /**
   * Initialize locale from localStorage or i18n default.
   * Listens to i18n language changes to keep state in sync.
   */
  const initial = normalizeLocale(localStorage.getItem(LS_LANGUAGE_KEY) || i18n.resolvedLanguage || 'de');
  const [locale, setLocale] = React.useState<SupportedLocale>(initial);

  React.useEffect(() => {
    // Sync locale state with i18n language changes
    const handler = (lng: string) => setLocale(normalizeLocale(lng));
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, [i18n]);

  /**
   * Initialize theme mode from localStorage.
   * Defaults to 'light' if not previously set.
   */
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(LS_THEME_KEY) as 'light' | 'dark' | null;
    return saved || 'light';
  });

  /**
   * Build MUI theme object based on current locale and theme mode.
   * Recreated when either locale or themeMode changes.
   */
  const theme = React.useMemo(() => buildTheme(locale, themeMode), [locale, themeMode]);

  /**
   * Toggle theme mode between light and dark.
   * Persists choice to localStorage and shows toast notification.
   */
  const toggleThemeMode = () => {
    setThemeMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(LS_THEME_KEY, next);
      setToast({
        open: true,
        msg: next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled',
        severity: 'info',
      });
      return next;
    });
  };

  /**
   * Change locale and sync with i18n.
   * Persists choice to localStorage and shows toast notification.
   */
  const handleLocaleChange = (next: SupportedLocale) => {
    localStorage.setItem(LS_LANGUAGE_KEY, next);
    setLocale(next);
    i18n.changeLanguage(next);
    setToast({
      open: true,
      msg: next === 'de' ? 'Sprache: Deutsch' : 'Language: English',
      severity: 'info',
    });
  };

  /**
   * Handle logout action.
   * Navigates to /logout which handles server/demo-specific flows
   * and then redirects to /logout-success.
   */
  const handleLogout = () => {
    logout();
    navigate('/logout', { replace: true });
  };

  /**
   * Session timeout/ping configuration.
   * Monitors idle time and pings backend to maintain session.
   */
  useSessionTimeout({
    pingEndpoint: '/api/me',
    pingIntervalMs: 60_000,
    enableIdleTimeout: false,
    idleTimeoutMs: 15 * 60_000,
  });

  // Drawer and dialog state
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // Toast notification state
  const [toast, setToast] = React.useState<{
    open: boolean;
    msg: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContext.Provider
        value={(msg: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => setToast({ open: true, msg, severity })}
      >
        {/* Application Header (fixed) */}
        <AppHeader
          themeMode={themeMode}
          onThemeModeChange={toggleThemeMode}
          locale={locale}
          onLocaleChange={handleLocaleChange}
          onLogout={handleLogout}
          helpTopic={helpTopic}
          isDemo={isDemo}
          onDrawerToggle={() => setMobileOpen((v) => !v)}
        />

        {/* Main container with sidebar + content */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            bgcolor: 'background.default',
          }}
        >
          {/* Sidebar Navigation */}
          <AppSidebar
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
            themeMode={themeMode}
            onThemeModeChange={toggleThemeMode}
            locale={locale}
            onLocaleChange={() => handleLocaleChange(locale === 'de' ? 'en' : 'de')}
            onLogout={handleLogout}
            onSettingsOpen={() => setSettingsOpen(true)}
            user={user || undefined}
          />

          {/* Main Content Area */}
          <AppMain isDemo={isDemo} />
        </Box>

        {/* Toast Notifications */}
        <Snackbar
          open={!!toast?.open}
          onClose={() => setToast((t) => (t ? { ...t, open: false } : t))}
          autoHideDuration={2500}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={toast?.severity || 'success'} elevation={1} variant="filled">
            {toast?.msg}
          </Alert>
        </Snackbar>

        {/* Settings Dialog */}
        <AppSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </ToastContext.Provider>
    </ThemeProvider>
  );
}
