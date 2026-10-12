/**
 * @file LogoutMenuAction.tsx
 * @module app/HamburgerMenu/MenuContent/LogoutMenuAction
 *
 * @summary
 * MenuItem that dismisses the popover before triggering logout.
 *
 * @enterprise
 * onClose() is called before onLogout() so the popover is gone before
 * logout-driven navigation starts; reversing the order causes a brief visual
 * flash where the menu reopens during the transition. Mounted exclusively by
 * the root HamburgerMenu.tsx via the MenuContent barrel.
 */

import { MenuItem, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';

interface LogoutMenuActionProps {
  /** Callback when logout is clicked */
  onLogout: () => void;

  /** Must fire before onLogout to prevent the menu flashing during navigation */
  onClose: () => void;
}

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
      <Typography variant="body2">{t('nav.logout')}</Typography>
    </MenuItem>
  );
}
