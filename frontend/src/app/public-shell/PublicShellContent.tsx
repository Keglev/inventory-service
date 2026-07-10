/**
 * @file PublicShellContent.tsx
 * @module PublicShellContent
 * @summary Main content region for public routes; owns the sole React.Suspense
 * boundary in this directory, wrapping the lazy-loaded route <Outlet />.
 *
 * @enterprise
 * - Suspense is scoped here (not in AppPublicShell) so the header remains
 *   interactive while a lazy route chunk is loading.
 *
 * @example
 * ```tsx
 * <PublicShellContent />
 * ```
 */
import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Fallback: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="body2" color="text.secondary">
        {t('loading')}
      </Typography>
    </Box>
  );
};

const PublicShellContent: React.FC = () => (
  <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
    <Toolbar /> {/* matches AppBar height so content isn't hidden beneath the fixed header */}

    <React.Suspense fallback={<Fallback />}>
      <Outlet />
    </React.Suspense>
  </Box>
);

export default PublicShellContent;
