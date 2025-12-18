/**
 * @file AppMain.tsx
 * @module app/layout/AppMain
 *
 * @summary
 * Main content area component rendering page content with demo notice banner.
 * Extracted from AppShell to isolate main content layout and demo mode messaging.
 *
 * @enterprise
 * - Responsive flexbox layout optimized for content scrolling
 * - Demo mode non-blocking information banner
 * - Suspense fallback for lazy-loaded page components
 * - Full TypeDoc coverage for content area and demo mode integration
 */

import { Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Toolbar,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface AppMainProps {
  /** Whether user is on demo account */
  isDemo: boolean;
}

/**
 * Main content area component.
 *
 * Renders the primary application content with optional demo mode banner.
 *
 * @param props - Component props
 * @returns JSX element rendering main content area
 */
export default function AppMain({ isDemo }: AppMainProps) {
  const { t } = useTranslation(['auth']);
  const location = useLocation();

  // Render-phase log to confirm this component is rendering
  try {
    if (localStorage.getItem('debugRouting') === '1') {
      console.debug('[AppMain] render', location.pathname + location.search);
    }
  } catch {
    // ignore
  }

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: 'auto',
        px: 0,
        pt: 0,
        pb: 0.5,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Spacer to account for fixed AppBar height */}
      <Toolbar />

      {/* Demo Mode Notice Banner (non-blocking, informational) */}
      {isDemo && (
        <Alert
          severity="info"
          icon={false}
          sx={{
            mb: 0.5,
            borderLeft: (theme) => `4px solid ${theme.palette.info.main}`,
            bgcolor: (theme) => theme.palette.info.light,
          }}
        >
          {t('auth:demoNotice', 'You are browsing in demo mode. Changes are disabled.')}
        </Alert>
      )}

      {/* Page Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Keyed to force remount when path/search changes, preventing stale route content */}
        <Outlet key={location.pathname + location.search} />
      </Box>
    </Box>
  );
}
