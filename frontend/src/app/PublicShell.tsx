/**
 * @file PublicShell.tsx
 * @description
 * Enterprise-quality shell for unauthenticated pages (Home, Login, LogoutSuccess).
 * Minimal header with language toggle and dark/light theme switcher.
 * No sidebar, no user profile, no navigation menu.
 *
 * @enterprise
 * - Clean, professional header suitable for public-facing pages.
 * - Language toggle (🇩🇪/🇺🇸) persists in localStorage and syncs with i18next.
 * - Dark/light theme toggle with localStorage persistence.
 * - Toast context for lightweight notifications.
 * - Responsive design (mobile-friendly).
 * - Full-width content area with proper spacing.
 *
 * @routing
 * Unauthenticated routes render as <Outlet /> within the content area.
 * Examples: /home, /login, /logout-success
 */
import * as React from 'react';
import { Outlet } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  CssBaseline,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useTranslation } from 'react-i18next';
import { ToastContext } from '../app/ToastContext';
import { buildTheme } from '../theme';
import type { SupportedLocale } from '../theme';
import deFlag from '/flags/de.svg';
import usFlag from '/flags/us.svg';

/* Layout constants */
const LS_KEY = 'i18nextLng';
const LS_THEME_KEY = 'themeMode';

/**
 * Normalize i18n language to SupportedLocale.
 * Examples:
 *  - 'de-DE' -> 'de'
 *  - 'en-US' -> 'en'
 */
const normalize = (lng?: string): SupportedLocale => (lng?.startsWith('en') ? 'en' : 'de');

/**
 * Fallback component while pages load
 */
const Fallback: React.FC = () => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Typography variant="body2" color="text.secondary">
      Loading...
    </Typography>
  </Box>
);

/**
 * PublicShell: Wrapper for unauthenticated pages with minimal header.
 */
const PublicShell: React.FC = () => {
  const { i18n, t } = useTranslation('common');

  // Toast state
  const [toast, setToast] = React.useState<{
    open: boolean;
    msg: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  // Initialize locale from i18n/localStorage
  const initial = normalize(localStorage.getItem(LS_KEY) || i18n.resolvedLanguage || 'de');
  const [locale, setLocale] = React.useState<SupportedLocale>(initial);

  // Theme mode (light/dark) with localStorage persistence
  const [themeMode, setThemeMode] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(LS_THEME_KEY) as 'light' | 'dark' | null;
    return saved || 'light';
  });

  // Keep locale state in sync with i18n
  React.useEffect(() => {
    const handler = (lng: string) => setLocale(normalize(lng));
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, [i18n]);

  // Build theme based on locale and theme mode
  const theme = React.useMemo(() => buildTheme(locale, themeMode), [locale, themeMode]);

  /**
   * Toggle language (DE <-> EN), persist choice, and let i18n drive the update
   */
  const toggleLocale = () => {
    const next: SupportedLocale = locale === 'de' ? 'en' : 'de';
    localStorage.setItem(LS_KEY, next);
    setLocale(next);
    i18n.changeLanguage(next);
    setToast({
      open: true,
      msg: next === 'de' ? 'Sprache: Deutsch' : 'Language: English',
      severity: 'info',
    });
  };

  /**
   * Toggle theme mode and persist to localStorage
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContext.Provider
        value={(msg, severity = 'success') => setToast({ open: true, msg, severity })}
      >
        {/* Fixed AppBar */}
        <AppBar position="fixed" color="primary" sx={{ width: '100%', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            {/* Logo/Title */}
            <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
              {t('app.title')}
            </Typography>

            {/* Theme toggle */}
            <Tooltip title={themeMode === 'light' ? 'Dark mode' : 'Light mode'}>
              <IconButton 
                onClick={toggleThemeMode}
                sx={{
                  color: themeMode === 'light' ? 'warning.main' : 'info.main',
                  transition: 'color 0.3s ease',
                }}
              >
                {themeMode === 'light' ? (
                  <LightModeIcon />
                ) : (
                  <DarkModeIcon />
                )}
              </IconButton>
            </Tooltip>

            {/* Language toggle */}
            <Tooltip title={t('actions.toggleLanguage')}>
              <IconButton onClick={toggleLocale}>
                <img
                  src={locale === 'de' ? deFlag : usFlag}
                  alt={locale === 'de' ? 'Deutsch' : 'English'}
                  width={20}
                  height={20}
                />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* Main content area */}
        <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
          <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
            <Toolbar /> {/* Spacing below fixed AppBar */}
            
            <React.Suspense fallback={<Fallback />}>
              <Outlet />
            </React.Suspense>
          </Box>
        </Box>

        {/* Toast notifications */}
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
      </ToastContext.Provider>
    </ThemeProvider>
  );
};

export default PublicShell;
