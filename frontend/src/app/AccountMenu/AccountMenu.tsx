/**
 * @file AccountMenu.tsx
 * @module app/AccountMenu/AccountMenu
 *
 * @summary
 * The avatar at the right end of the toolbar and its menu: profile (name,
 * e-mail, role), About Smart Supply Pro, and sign-out.
 *
 * @enterprise
 * - SAP Fiori makes the profile a mandatory shell-bar element that opens the
 *   user menu (name, identifier, role, About, Sign Out); Microsoft 365 and Jira
 *   put it in the same place. It replaced the hamburger user menu (FW6 UX-1,
 *   Carlos 2026-10-12). Settings is not in it: the sidebar holds that entry, so
 *   identity and preferences each have one home.
 * - Initials, not a photo: the session carries no picture. A demo session's
 *   identity is the fixed "Demo User" (AuthContext), so the demo avatar reads
 *   "DU" and never shows a real person's data.
 * - Sign-out closes the menu before it navigates (LogoutMenuAction).
 */

import * as React from 'react';
import {
  Avatar,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import ProfileMenuSection from './ProfileMenuSection';
import LogoutMenuAction from './LogoutMenuAction';

export interface AccountMenuProps {
  /** Opens the About dialog */
  onAboutOpen: () => void;

  /** Callback for logout action */
  onLogout: () => void;
}

/** Up to two initials from the first and last word of a name; empty for no name. */
function initialsOf(fullName: string | undefined): string {
  const words = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/**
 * Avatar menu for the toolbar.
 *
 * @param props - About and logout callbacks
 * @returns the avatar button and its menu
 */
export default function AccountMenu({ onAboutOpen, onLogout }: AccountMenuProps) {
  const { t } = useTranslation(['common']);
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const initials = initialsOf(user?.fullName);

  const handleClose = () => setAnchorEl(null);

  // WHY: close the menu first so focus returns to the avatar before the dialog takes it.
  const openAbout = () => {
    handleClose();
    onAboutOpen();
  };

  return (
    <>
      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label={t('menu.account')}
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        title={user?.fullName}
        sx={{ p: 0.5 }}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            fontSize: 13,
            fontWeight: 700,
            bgcolor: 'common.white',
            color: 'primary.main',
          }}
        >
          {initials || <PersonOutlineIcon data-testid="PersonOutlineIcon" fontSize="small" />}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        slotProps={{ paper: { sx: { maxWidth: 360 } } }}
      >
        <ProfileMenuSection />
        <Divider />
        <MenuItem onClick={openAbout}>
          <ListItemIcon>
            <InfoOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={t('menu.about')} />
        </MenuItem>
        <Divider />
        <LogoutMenuAction onLogout={onLogout} onClose={handleClose} />
      </Menu>
    </>
  );
}
