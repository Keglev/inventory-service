/**
 * @file NotificationsMenuSection.tsx
 * @module app/HamburgerMenu/NotificationsMenuSection
 *
 * @summary
 * Notifications section with low-stock alerts.
 * Fetches low-stock item count from backend and displays notification status.
 */

import { Box, Typography, Stack, Chip, Skeleton } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getLowStockCount } from '../../api/metrics';

export default function NotificationsMenuSection() {
  // Only need the common namespace here; remove mixed namespace lookups to avoid fallbacks.
  const { t } = useTranslation('common');

  // Fetch low-stock count from backend
  const q = useQuery<number>({
    queryKey: ['notifications', 'lowStockCount'],
    queryFn: getLowStockCount,
    staleTime: 30_000,
    retry: 1,
  });

  const lowStockCount = q.data ?? 0;
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
          {/* ALERT SECTION */}
          <Stack spacing={0.5} sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <NotificationsActiveIcon sx={{ fontSize: 20, color: 'warning.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                {t('common:notifications.lowStockAlert', 'Low Stock Alert')}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {t(
                'common:notifications.lowStockMessage',
                'You have {{count}} merchandise item(s) with low stock',
                { count: lowStockCount }
              )}
            </Typography>
          </Stack>

          {/* QUICK STATS */}
          <Box sx={{ mt: 1 }}>
            <Chip
              size="small"
              label={
                <Typography variant="caption">
                  {t('common:notifications.itemsLowStock', '{{count}} items below minimum', {
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
            {t('common:notifications.allGood', 'All clear – no low stock items')}
          </Typography>
        </Stack>
      )}
    </>
  );
}
