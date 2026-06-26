/**
 * @file NotificationsMenuSection.tsx
 * @module app/HamburgerMenu/NotificationsMenuSection
 *
 * @summary
 * Notification section coordinator; reads lowStockCount from useDashboardMetrics
 * and renders one of three states: loading skeleton, low-stock alert, or all-clear.
 *
 * @enterprise
 * Data origin: api/analytics/hooks (useDashboardMetrics); only .data?.lowStockCount
 * is consumed. Mounted exclusively by MenuContent/MenuSectionsRenderer.
 * This file is the duplicate rendering site flagged as CB-APP12 — the
 * NotificationSettings/* directory exports the same states as components.
 */

import { Box, Typography, Stack, Chip, Skeleton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from 'react-i18next';
import { useDashboardMetrics } from '../../api/analytics/hooks';

export default function NotificationsMenuSection() {
  const { t } = useTranslation('common');
  const q = useDashboardMetrics();
  // BUCKET: this file reimplements JSX that NotificationSettings/* already exports as components; either import them or delete the dir (CB-APP12)

  const lowStockCount = q.data?.lowStockCount ?? 0;
  const hasLowStock = !q.isLoading && lowStockCount > 0;

  if (q.isLoading) {
    return (
      <Stack spacing={0.5} sx={{ p: 1 }}>
        <Skeleton variant="text" width={160} />
        <Skeleton variant="text" width={120} />
      </Stack>
    );
  }

  return (
    <>
      {hasLowStock ? (
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

          <Box sx={{ mt: 1 }}>
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
          </Box>
        </>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1 }}>
          <NotificationsIcon sx={{ fontSize: 20, color: 'success.main' }} />
          <Typography variant="caption" color="success.main">
            {t('notifications.allGood', 'All clear – no low stock items')}
          </Typography>
        </Stack>
      )}
    </>
  );
}
