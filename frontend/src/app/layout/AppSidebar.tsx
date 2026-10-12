/**
 * @file AppSidebar.tsx
 * @module app/layout/AppSidebar
 *
 * @summary
 * Left sidebar navigation drawer.
 * Thin orchestrator: drawer chrome only; the content comes from SidebarDrawerContent.
 *
 * @enterprise
 * - Two Drawer variants (temporary on mobile, permanent on desktop) share one content tree via SidebarDrawerContent, avoiding JSX duplication for each breakpoint.
 * - Desktop shows an 88 px rail, icon above label (FW6 UX-1, option A): with four destinations the former 248 px drawer was mostly empty. The phone drawer keeps full rows at 248 px.
 * - Navigation plus one settings entry (FW6): identity, About and sign-out live in the avatar menu, help in the toolbar.
 */

import { Box, Drawer } from '@mui/material';
import { SidebarDrawerContent } from './SidebarDrawerContent';

/** Phone drawer width: full rows with icon and label side by side. */
const drawerWidth = 248;

/** Desktop rail width: room for the longest German label ("Einstellungen") under its icon. */
const railWidth = 88;

interface AppSidebarProps {
  /** Whether drawer is open on mobile */
  mobileOpen: boolean;

  /** Callback to close drawer on mobile */
  onMobileClose: () => void;

  /** Opens the settings dialog */
  onSettingsOpen: () => void;
}

/**
 * Application sidebar component.
 *
 * Thin orchestrator that delegates rendering to SidebarDrawerContent: a
 * temporary drawer of full rows on phones, a permanent rail on desktop.
 *
 * @param props - Component props
 * @returns JSX element rendering sidebar navigation
 */
export default function AppSidebar({ mobileOpen, onMobileClose, onSettingsOpen }: AppSidebarProps) {
  // WHY: on phones the drawer covers the page; close it so the dialog opens over the app.
  const openSettingsFromDrawer = () => {
    onMobileClose();
    onSettingsOpen();
  };

  return (
    <Box
      component="nav"
      sx={{
        // Height is bounded by the viewport-fit shell row:
        // the sidebar must end above the footer, never overflow beneath it.
        width: { md: railWidth },
        flexShrink: { md: 0 },
        minHeight: 0,
        display: 'flex',
        flexDirection: { md: 'column' },
      }}
    >
      {/* Mobile Drawer (temporary, hidden on md+) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth },
        }}
      >
        <SidebarDrawerContent variant="list" onSettingsOpen={openSettingsFromDrawer} />
      </Drawer>

      {/* Desktop Drawer (permanent, hidden on xs) */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: 1,
          '& .MuiDrawer-paper': {
            width: railWidth,
            boxSizing: 'border-box',
            height: '100%',
            position: 'relative',
            overflowY: 'auto',
            pb: 1,
          },
        }}
      >
        <SidebarDrawerContent variant="rail" onSettingsOpen={onSettingsOpen} />
      </Drawer>
    </Box>
  );
}
