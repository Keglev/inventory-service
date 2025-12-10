/**
 * @file AllClearNotificationSection.tsx
 * @module app/HamburgerMenu/NotificationSettings/AllClearNotificationSection
 *
 * @summary
 * Displays "all clear" status when no low-stock items exist.
 * Shows success-styled message with checkmark icon.
 *
 * @example
 * ```tsx
 * <AllClearNotificationSection />
 * ```
 */

import { Stack, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTranslation } from 'react-i18next';

/**
 * All-clear notification display component.
 *
 * Shows success message indicating no low-stock items.
 *
 * @returns JSX element displaying all-clear notification
 */
export default function AllClearNotificationSection() {
  const { t } = useTranslation('common');

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1 }}>
      <NotificationsIcon sx={{ fontSize: 20, color: 'success.main' }} />
      <Typography variant="caption" color="success.main">
        {t('notifications.allGood', 'All clear – no low stock items')}
      </Typography>
    </Stack>
  );
}
