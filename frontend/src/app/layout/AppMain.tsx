/**
 * @file AppMain.tsx
 * @module app/layout/AppMain
 *
 * @summary
 * Main content area component rendering page content.
 *
 * @enterprise
 * - Owns all content-area layout, so AppShell stays a pure orchestrator.
 * - No demo banner row: the header DEMO badge (with explanatory tooltip) and the
 *   mutation dialogs' demo guard message show the demo state without costing a
 *   full-width row on every page.
 * - Single internal scroll region of the viewport-fit shell.
 */

import { Outlet } from 'react-router-dom';
import {
  Box,
  Toolbar,
} from '@mui/material';

/**
 * Main content area component.
 *
 * Renders the primary application content inside the viewport-fit shell.
 *
 * @returns JSX element rendering main content area
 */
export default function AppMain() {
  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        px: 0,
        pt: 0,
        pb: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Spacer to account for fixed AppBar height */}
      <Toolbar />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
