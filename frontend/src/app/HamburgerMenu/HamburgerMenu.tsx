/**
 * @file HamburgerMenu.tsx
 * @module app/HamburgerMenu
 *
 * @summary
 * Hamburger menu (4-line icon) coordinator managing menu state and popover.
 * Orchestrates menu content rendering with theme, locale, and logout callbacks.
 *
 * @enterprise
 * - Separates menu state management from content rendering
 * - Delegates menu sections to MenuSectionsRenderer
 * - Responsive popover menu (scrollable on mobile)
 * - Clean separation of concerns
 */

import * as React from 'react';
import {
  IconButton,
  Menu,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import { MenuSectionsRenderer, LogoutMenuAction } from './MenuContent';
import type { SupportedLocale } from '../../theme';

interface HamburgerMenuProps {
  /** Current theme mode (light or dark) */
  themeMode: 'light' | 'dark';

  /** Callback when theme mode changes */
  onThemeModeChange: (mode: 'light' | 'dark') => void;

  /** Current locale setting */
  locale: SupportedLocale;

  /** Callback when locale changes */
  onLocaleChange: (locale: SupportedLocale) => void;

  /** Callback for logout action */
  onLogout: () => void;
}

/**
 * Hamburger menu component.
 *
 * Manages menu popover state and renders all menu sections.
 * Comprehensive app options:
 * - My Profile (name, email/demo message, role)
 * - Appearance (theme toggle, table density)
 * - Language & Region (language, date format, number format)
 * - Notifications (low-stock alerts)
 * - Help & Documentation (links)
 * - System Info (environment, backend URL, version)
 * - Logout
 *
 * @param props - Component props
 * @returns JSX element rendering hamburger menu with popover
 */
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

  // Open menu when hamburger button is clicked
  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Close menu
  const handleClose = () => {
    setAnchorEl(null);
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
        slotProps={{
          paper: {
            sx: {
              maxWidth: 360,
              maxHeight: '80vh',
              overflowY: 'auto',
              bgcolor: 'background.paper',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Menu Sections with Dividers */}
        <MenuSectionsRenderer
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          locale={locale}
          onLocaleChange={onLocaleChange}
          onClose={handleClose}
        />

        {/* Logout Action */}
        <LogoutMenuAction onLogout={onLogout} onClose={handleClose} />
      </Menu>
    </>
  );
}
