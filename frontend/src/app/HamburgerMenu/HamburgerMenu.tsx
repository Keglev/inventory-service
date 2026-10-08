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
 * The user menu (SAP Fiori pattern, FW5 fork 1): it holds no preferences; its
 * Settings entry opens the settings dialog through onSettingsOpen.
 * The trigger is the three-line icon on desktop; below the md breakpoint, where
 * the header already shows a three-line drawer toggle on the left, it is a
 * person outline so the two buttons stay distinguishable.
 * The onClose callback threaded through MenuSectionsRenderer (one per section
 * wrapper) is what dismisses the popover on any section interaction.
 */

import * as React from 'react';
import {
  IconButton,
  Menu,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { default as MenuSectionsRenderer } from './MenuContent/MenuSectionsRenderer';
import { default as LogoutMenuAction } from './MenuContent/LogoutMenuAction';

interface HamburgerMenuProps {
  /** Opens the settings dialog */
  onSettingsOpen: () => void;

  /** Opens the About dialog */
  onAboutOpen: () => void;

  /** Callback for logout action */
  onLogout: () => void;
}

/**
 * Root popover orchestrator. Anchors the MUI Menu to the hamburger IconButton
 * and wires the close callback into every child section so any interaction
 * dismisses the popover.
 */
export default function HamburgerMenu({
  onSettingsOpen,
  onAboutOpen,
  onLogout,
}: HamburgerMenuProps) {
  const { t } = useTranslation(['common']);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));

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
        aria-label={t('actions.menu')}
        sx={{
          color: 'inherit',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        {/* WHY: explicit ids equal MUI's own defaults; specs replace all icons with one stub. */}
        {isNarrow ? <PersonOutlineIcon data-testid="PersonOutlineIcon" /> : <MenuIcon data-testid="MenuIcon" />}
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
          onSettingsOpen={onSettingsOpen}
          onAboutOpen={onAboutOpen}
          onClose={handleClose}
        />

        <LogoutMenuAction onLogout={onLogout} onClose={handleClose} />
      </Menu>
    </>
  );
}
