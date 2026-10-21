/**
 * @file SidebarDrawerContent.tsx
 * @module app/layout/SidebarDrawerContent
 *
 * @summary
 * The shared content tree for the sidebar's mobile and desktop Drawer variants:
 * the navigation list and, under a divider, the settings entry. Extracted from
 * AppSidebar so both Drawer variants render one source of truth.
 *
 * @enterprise
 * - Navigation only (FW5 fork 1): the former footer (profile, environment and
 *   version, theme/language/settings/help buttons) duplicated the header, the
 *   user menu and the footer, so each of those now exists once. Settings
 *   returned in FW6 as the one entry that is not navigation (SidebarSettingsItem).
 * - The drawer starts with an empty Toolbar: the AppBar covers the drawer's top
 *   edge, and the "Smart Supply Pro" title that used to sit there was hidden
 *   under it while screen readers still read the product name twice.
 */

import { Box, Divider, Toolbar } from '@mui/material';
import { default as SidebarNavList } from './sidebar/SidebarNavList';
import SidebarSettingsItem from './sidebar/SidebarSettingsItem';
import type { SidebarVariant } from './sidebar/sidebarVariant';

export interface SidebarDrawerContentProps {
  /** List rows (phone drawer) or rail tiles (desktop) */
  variant: SidebarVariant;

  /** Opens the settings dialog */
  onSettingsOpen: () => void;
}

/** Sidebar drawer content shared by the mobile and desktop Drawer variants. */
export function SidebarDrawerContent({ variant, onSettingsOpen }: SidebarDrawerContentProps) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Spacer under the fixed AppBar */}
      <Toolbar />

      <SidebarNavList variant={variant} />
      <Divider sx={{ mx: 2, my: 0.5 }} />
      <SidebarSettingsItem variant={variant} onOpen={onSettingsOpen} />
    </Box>
  );
}
