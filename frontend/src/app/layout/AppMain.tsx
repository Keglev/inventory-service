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

import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  Box,
  Toolbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface AppMainProps {
  /** Whether user is on demo account */
  isDemo: boolean;
}

/**
 * Loading fallback component displayed while page content is loading.
 *
 * @returns JSX element showing spinner during Suspense fallback
 */
function LoadingFallback() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
      <CircularProgress />
    </Box>
  );
}

/**
 * Main content area component.
 *
 * Renders the primary application content with optional demo mode banner.
 * Provides Suspense boundary for lazy-loaded page components.
 *
 * @param props - Component props
 * @returns JSX element rendering main content area
 */
export default function AppMain({ isDemo }: AppMainProps) {
  const { t } = useTranslation(['auth']);

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

      {/* Page Content Area with Suspense Boundary */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <React.Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </React.Suspense>
      </Box>
    </Box>
  );
}
