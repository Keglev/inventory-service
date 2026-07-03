/**
 * @file AppMain.tsx
 * @module app/layout/AppMain
 *
 * @summary
 * Main content area component rendering page content.
 * Extracted from AppShell to isolate main content layout.
 *
 * @enterprise
 * - Extracted from AppShell to keep the shell a pure orchestrator; all content-area layout lives here.
 * - The former demo-mode banner row was removed (CB-APP77): demo state is
 *   indicated by the header DEMO badge (with explanatory tooltip), and every
 *   mutation dialog shows the demo guard message on attempted changes. The
 *   banner cost a full-width row on every page.
 * - Single internal scroll region of the viewport-fit shell (CB-APP73).
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
        pb: 0.5,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Spacer to account for fixed AppBar height */}
      <Toolbar />

      {/* Page Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
