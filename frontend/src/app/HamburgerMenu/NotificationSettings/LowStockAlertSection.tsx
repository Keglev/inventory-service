/**
 * @file LowStockAlertSection.tsx
 * @module app/HamburgerMenu/NotificationSettings/LowStockAlertSection
 *
 * @summary
 * DEAD IN PRODUCTION — NotificationsMenuSection reimplements this JSX inline and does
 * not import this component; only test files consume it. Would render the warning Stack
 * + chip with low-stock item count.
 *
 * @enterprise
 * - Zero production importers; NotificationsMenuSection duplicates this JSX inline
 *   instead of importing (see CB-APP12).
 *
 * @example
 * ```tsx
 * <LowStockAlertSection lowStockCount={5} />
 * ```
 */

import { Stack, Typography, Chip } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from 'react-i18next';

interface LowStockAlertSectionProps {
  lowStockCount: number;
}

export default function LowStockAlertSection({ lowStockCount }: LowStockAlertSectionProps) {
  // BUCKET: dead in production — NotificationsMenuSection reimplements this JSX inline; either wire it or delete the dir (CB-APP12)
  const { t } = useTranslation('common');

  return (
    <>
      <Stack spacing={0.5} sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <NotificationsActiveIcon sx={{ fontSize: 20, color: 'warning.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
            {t('notifications.lowStockAlert', 'Low Stock Alert')}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {t(
            'notifications.lowStockMessage',
            'You have {{count}} merchandise item(s) with low stock',
            { count: lowStockCount }
          )}
        </Typography>
      </Stack>

      <Stack sx={{ mt: 1 }}>
        <Chip
          size="small"
          label={
            <Typography variant="caption">
              {t('notifications.itemsLowStock', '{{count}} items below minimum', {
                count: lowStockCount,
              })}
            </Typography>
          }
          color="warning"
          variant="outlined"
        />
      </Stack>
    </>
  );
}
