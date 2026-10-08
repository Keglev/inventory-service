/**
 * @file AppShell.tsx
 * @module app/layout/AppShell
 *
 * @summary
 * Thin orchestrator managing application shell state and layout coordination.
 * Delegates rendering to focused sub-components (header, sidebar, main).
 *
 * @enterprise
 * - Theme mode and locale are owned by ShellPreferencesProvider (App.tsx); AppShell only applies the theme. The header, the user menu and the settings dialog read what they need themselves, so no preference props pass through the shell (FW5).
 * - Session keep-alive ping fires at shell level so it runs regardless of which page route is active.
 * - Viewport-fit layout: an inner flex column bounds the shell to exactly one viewport (100dvh, overflow hidden); AppMain is the single internal scroll region, so the footer is always visible. AppPublicShell keeps its own document-scroll layout and is unaffected.
 * - Single Snackbar instance prevents duplicate toasts from concurrent state changes across sub-components.
 * - Delegates all rendering to AppHeader, AppSidebar, AppMain — this file coordinates, not renders.
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
import { useQueryClient } from '@tanstack/react-query';
import { useSessionTimeout } from '../../features/auth/hooks/useSessionTimeout';
import { ToastContext } from '../../context/toast/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { useShellLogout } from './useShellLogout';
import { default as AppSettingsDialog } from '../settings/AppSettingsDialog';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import AppMain from './AppMain';
import { getHelpTopicForRoute } from './navConfig';
import { useShellPreferences } from '../../hooks/useShellPreferences';
import { default as AppFooter } from '../footer/AppFooter';
import HelpPanel from '../../components/help/HelpPanel';

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
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const isDemo = Boolean(user?.isDemo);

  // Get current help topic based on route
  const helpTopic = getHelpTopicForRoute(location.pathname);

  // Toast notification state
  const [toast, setToast] = React.useState<{
    open: boolean;
    msg: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  // Emit a toast; shared by ToastContext consumers and the shell's own handlers.
  const notify = (msg: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') =>
    setToast({ open: true, msg, severity });

  // MUI theme from the shared preferences; the settings dialog changes them.
  const { theme } = useShellPreferences();

  // Logout flow (demo redirect vs real POST-form logout) lives in useShellLogout.
  const handleLogout = useShellLogout({ isDemo, logout, queryClient, navigate });

  // Idle timeout is intentionally disabled (enableIdleTimeout: false); this hook only pings
  // the backend to keep the session alive, not to enforce inactivity logout.
  useSessionTimeout({
    pingEndpoint: '/api/me',
    pingIntervalMs: 60_000,
    enableIdleTimeout: false,
    idleTimeoutMs: 15 * 60_000,
  });

  // Drawer and dialog state
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContext.Provider value={notify}>
        {/* Viewport-fit shell: bounds header + content + footer to exactly
            one viewport; AppMain is the single internal scroll region. */}
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
          {/* Application Header (fixed) */}
          <AppHeader
            onSettingsOpen={() => setSettingsOpen(true)}
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
            />

            {/* Main Content Area */}
            <AppMain />
          </Box>

          {/* Global footer — inside the ThemeProvider so it follows light/dark mode */}
          <AppFooter />
        </Box>

        {/* Help drawer — inside the ThemeProvider so it follows light/dark mode */}
        <HelpPanel />

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
