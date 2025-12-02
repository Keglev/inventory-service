/**
 * @file HamburgerMenu.tsx
 * @module app/HamburgerMenu
 *
 * @summary
 * Hamburger menu (4-line icon) with comprehensive app options:
 * - My Profile (name, email/demo message, role)
 * - Appearance (theme toggle, table density)
 * - Language & Region (language, date format, number format)
 * - Notifications (low-stock alerts)
 * - Help & Documentation (links)
 * - System Info (environment, backend URL, version)
 * - Logout
 *
 * @enterprise
 * - Uses custom sub-components for each section (clean separation of concerns)
 * - Reuses existing settings hooks and auth context
 * - Responsive popover menu (scrollable on mobile)
 * - Dividers between major sections
 */

import * as React from 'react';
import {
  IconButton,
  Menu,
  Box,
  Divider,
  MenuItem,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';
import ProfileMenuSection from './ProfileMenuSection';
import AppearanceMenuSection from './AppearanceMenuSection';
import LanguageRegionMenuSection from './LanguageRegionMenuSection';
import NotificationsMenuSection from './NotificationsMenuSection';
import HelpDocsMenuSection from './HelpDocsMenuSection';
import SystemInfoMenuSection from './SystemInfoMenuSection';
import type { SupportedLocale } from '../../theme';

interface HamburgerMenuProps {
  themeMode: 'light' | 'dark';
  onThemeModeChange: (mode: 'light' | 'dark') => void;
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
  onLogout: () => void;
}

export default function HamburgerMenu({
  themeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
  onLogout,
}: HamburgerMenuProps) {
  const { t } = useTranslation(['common']);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleClose();
    onLogout();
  };

  return (
    <>
      {/* Hamburger Button */}
      <IconButton
        onClick={handleOpen}
        title={t('actions.menu', 'Menu')}
        sx={{
          color: 'inherit',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Menu Popover */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxWidth: 360,
            maxHeight: '80vh',
            overflowY: 'auto',
            bgcolor: 'background.paper',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Profile Section */}
        <Box onClick={handleClose}>
          <ProfileMenuSection />
        </Box>

        <Divider />

        {/* Appearance Section */}
        <Box onClick={handleClose}>
          <AppearanceMenuSection themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
        </Box>

        <Divider />

        {/* Language & Region Section */}
        <Box onClick={handleClose}>
          <LanguageRegionMenuSection locale={locale} onLocaleChange={onLocaleChange} />
        </Box>

        <Divider />

        {/* Notifications Section */}
        <Box onClick={handleClose}>
          <NotificationsMenuSection />
        </Box>

        <Divider />

        {/* Help & Docs Section */}
        <Box onClick={handleClose}>
          <HelpDocsMenuSection />
        </Box>

        <Divider />

        {/* System Info Section */}
        <Box onClick={handleClose}>
          <SystemInfoMenuSection />
        </Box>

        <Divider />

        {/* Logout MenuItem */}
        <MenuItem
          onClick={handleLogoutClick}
          sx={{
            py: 1,
            px: 2,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <LogoutIcon fontSize="small" />
          <Typography variant="body2">{t('nav.logout', 'Logout')}</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
