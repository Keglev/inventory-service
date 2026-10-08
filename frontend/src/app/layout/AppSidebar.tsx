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
 * - Navigation only (FW5 fork 1, SAP Fiori side navigation): identity, settings, help and sign-out live in the header and its user menu.
 */

import { Box, Drawer } from '@mui/material';
import { SidebarDrawerContent } from './SidebarDrawerContent';

const drawerWidth = 248;

interface AppSidebarProps {
  /** Whether drawer is open on mobile */
  mobileOpen: boolean;

  /** Callback to close drawer on mobile */
  onMobileClose: () => void;
}

/**
 * Application sidebar component.
 *
 * Thin orchestrator that delegates rendering to focused sub-components.
 * Renders responsive drawer with navigation, user profile, environment info,
 * and action buttons in the footer.
 *
 * @param props - Component props
 * @returns JSX element rendering sidebar navigation
 */
export default function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const drawerContent = (
    <SidebarDrawerContent />
  );

  return (
    <Box
      component="nav"
      sx={{
        // Height is bounded by the viewport-fit shell row:
        // the sidebar must end above the footer, never overflow beneath it.
        width: { md: drawerWidth },
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
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer (permanent, hidden on xs) */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          flex: 1,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            height: '100%',
            position: 'relative',
            overflowY: 'auto',
            pb: 1,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
