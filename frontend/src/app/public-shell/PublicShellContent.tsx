/**
 * @file PublicShellContent.tsx
 * @description
 * Main content area for public shell with Suspense fallback.
 * Renders outlet for unauthenticated routes (Home, Login, LogoutSuccess).
 *
 * @enterprise
 * - Responsive spacing (xs: 2, md: 3)
 * - Suspense boundary with loading fallback
 * - Proper spacing below fixed AppBar via Toolbar
 * - Full viewport height with scrollable content
 *
 * @example
 * ```tsx
 * <PublicShellContent />
 * ```
 */
import * as React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, Typography } from '@mui/material';

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
 * PublicShellContent component
 * @returns Main content area with route outlet
 */
const PublicShellContent: React.FC = () => (
  <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
    <Toolbar /> {/* Spacing below fixed AppBar */}

    <React.Suspense fallback={<Fallback />}>
      <Outlet />
    </React.Suspense>
  </Box>
);

export default PublicShellContent;
