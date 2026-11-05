/**
 * @file SidebarDrawerContent.tsx
 * @module app/layout/SidebarDrawerContent
 *
 * @summary
 * The shared content tree for the sidebar's mobile and desktop Drawer variants: the
 * navigation list and, under a divider, the settings entry.
 *
 * @enterprise
 * - One content tree, so both Drawer variants render one source of truth.
 * - Navigation plus the settings entry (SidebarSettingsItem), the one entry that is
 *   not navigation: profile, version and help live in the header, the user menu and
 *   the footer, so each exists once.
 * - The drawer starts with an empty Toolbar: the AppBar covers the drawer's top
 *   edge, so a title there would be hidden while screen readers read the product
 *   name twice.
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
