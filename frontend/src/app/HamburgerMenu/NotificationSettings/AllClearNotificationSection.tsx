/**
 * @file AllClearNotificationSection.tsx
 * @module app/HamburgerMenu/NotificationSettings/AllClearNotificationSection
 *
 * @summary
 * Renders the success "all clear" row when no low-stock items exist.
 *
 * @enterprise
 * - Mounted by NotificationsMenuSection when lowStockCount is 0.
 *
 * @example
 * ```tsx
 * <AllClearNotificationSection />
 * ```
 */

import { Stack, Typography } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTranslation } from 'react-i18next';

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
