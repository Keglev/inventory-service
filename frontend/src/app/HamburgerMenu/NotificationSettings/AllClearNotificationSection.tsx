/**
 * @file AllClearNotificationSection.tsx
 * @module app/HamburgerMenu/NotificationSettings/AllClearNotificationSection
 *
 * @summary
 * DEAD IN PRODUCTION — NotificationsMenuSection reimplements this JSX inline and does
 * not import this component; only test files consume it. Would render the success
 * "all clear" row when no low-stock items exist.
 *
 * @enterprise
 * - Zero production importers; NotificationsMenuSection duplicates this JSX inline
 *   instead of importing (see CB-APP12).
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
  // BUCKET: dead in production — NotificationsMenuSection reimplements this JSX inline; either wire it or delete the dir (CB-APP12)
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
