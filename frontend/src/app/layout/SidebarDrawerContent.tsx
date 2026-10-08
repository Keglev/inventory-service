/**
 * @file SidebarDrawerContent.tsx
 * @module app/layout/SidebarDrawerContent
 *
 * @summary
 * The shared content tree for the sidebar's mobile and desktop Drawer variants:
 * branding header and the navigation list. Extracted from AppSidebar so both
 * Drawer variants render one source of truth.
 *
 * @enterprise
 * - Navigation only (FW5 fork 1): the former footer (profile, environment and
 *   version, theme/language/settings/help buttons) duplicated the header, the
 *   user menu and the footer, so each of those now exists once.
 */

import { Box, Toolbar, Typography, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { default as SidebarNavList } from './sidebar/SidebarNavList';

/** Sidebar drawer content shared by the mobile and desktop Drawer variants. */
export function SidebarDrawerContent() {
  const { t } = useTranslation(['common']);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Drawer Header - App Title */}
      <Toolbar>
        <Typography variant="subtitle1" fontWeight={700}>
          {t('app.branding')}
        </Typography>
      </Toolbar>
      <Divider />

      {/* Navigation Items */}
      <SidebarNavList />
    </Box>
  );
}
