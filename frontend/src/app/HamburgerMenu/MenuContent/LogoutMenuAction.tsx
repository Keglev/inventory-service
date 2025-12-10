/**
 * @file LogoutMenuAction.tsx
 * @module app/HamburgerMenu/MenuContent/LogoutMenuAction
 *
 * @summary
 * Logout menu item component with logout icon and callback.
 * Handles logout action trigger with menu close integration.
 *
 * @example
 * ```tsx
 * <LogoutMenuAction onLogout={handleLogout} onClose={handleClose} />
 * ```
 */

import { MenuItem, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';

interface LogoutMenuActionProps {
  /** Callback when logout is clicked */
  onLogout: () => void;

  /** Callback to close menu before logout */
  onClose: () => void;
}

/**
 * Logout menu action component.
 *
 * Renders logout menu item with icon and label.
 * Closes menu before triggering logout callback.
 *
 * @param props - Component props
 * @returns JSX element rendering logout menu item
 */
export default function LogoutMenuAction({
  onLogout,
  onClose,
}: LogoutMenuActionProps) {
  const { t } = useTranslation(['common']);

  const handleLogoutClick = () => {
    onClose();
    onLogout();
  };

  return (
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
  );
}
