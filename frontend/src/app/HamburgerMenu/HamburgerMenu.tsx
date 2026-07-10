/**
 * @file HamburgerMenu.tsx
 * @module app/HamburgerMenu
 *
 * @summary
 * Popover menu root — mounts the MUI Menu, owns only the anchor open/closed
 * state, and composes MenuSectionsRenderer + LogoutMenuAction inside it.
 * Single consumer: AppToolbarActions.
 *
 * @enterprise
 * Theme, locale, and settings state are owned by AppShell and flow down via
 * AppToolbarActions; HamburgerMenu neither persists nor mutates them.
 * The onClose callback threaded through MenuSectionsRenderer (one per section
 * wrapper) is what dismisses the popover on any section interaction.
 * Distinct from the public-shell settings surface — this is the authenticated
 * shell's in-toolbar settings entry point (tracked under ST-APP4; do not merge
 * the two UIs here).
 */

import * as React from 'react';
import {
  IconButton,
  Menu,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useTranslation } from 'react-i18next';
import { default as MenuSectionsRenderer } from './MenuContent/MenuSectionsRenderer';
import { default as LogoutMenuAction } from './MenuContent/LogoutMenuAction';
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
 * Root popover orchestrator. Anchors the MUI Menu to the hamburger IconButton
 * and wires the close callback into every child section so any interaction
 * dismisses the popover.
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

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        title={t('actions.menu')}
        sx={{
          color: 'inherit',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <MenuIcon />
      </IconButton>

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
        <MenuSectionsRenderer
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          locale={locale}
          onLocaleChange={onLocaleChange}
          onClose={handleClose}
        />

        <LogoutMenuAction onLogout={onLogout} onClose={handleClose} />
      </Menu>
    </>
  );
}
