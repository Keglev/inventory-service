/**
 * @file NotificationsMenuSection.tsx
 * @module app/HamburgerMenu/NotificationsMenuSection
 *
 * @summary
 * Notifications section with low-stock alerts.
 * Fetches low-stock item count from backend and displays notification status.
 */

import {
  Box,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import httpClient from '../../api/httpClient';

interface LowStockNotification {
  count: number;
  hasLowStock: boolean;
}

export default function NotificationsMenuSection() {
  const { t } = useTranslation(['common', 'analytics']);

  // Fetch low-stock count from backend
  const q = useQuery<LowStockNotification>({
    queryKey: ['notifications', 'lowStock'],
    queryFn: async () => {
      const res = await httpClient.get('/analytics/low-stock-count');
      return res.data as LowStockNotification;
    },
    staleTime: 30_000, // Cache for 30 seconds
    retry: 1,
  });

  const hasLowStock = q.data?.hasLowStock ?? false;
  const lowStockCount = q.data?.count ?? 0;

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('notifications.title', 'Benachrichtungen / Notifications')}
      </Typography>

      <Stack spacing={1}>
        {q.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : q.isError ? (
          <Alert severity="warning" sx={{ py: 0.5 }}>
            <Typography variant="caption">
              {t('notifications.error', 'Could not load notifications')}
            </Typography>
          </Alert>
        ) : (
          <>
            {hasLowStock ? (
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
                    'You have {{count}} merchandise item(s) with low or no stock',
                    { count: lowStockCount }
                  )}
                </Typography>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1 }}>
                <NotificationsIcon sx={{ fontSize: 20, color: 'success.main' }} />
                <Typography variant="caption" color="success.main">
                  {t('notifications.allGood', 'All clear – no low stock items')}
                </Typography>
              </Stack>
            )}

            {/* Quick Stats */}
            <Box>
              <Chip
                size="small"
                label={
                  <Typography variant="caption">
                    {t('notifications.itemsLowStock', '{{count}} items below minimum', {
                      count: lowStockCount,
                    })}
                  </Typography>
                }
                color={hasLowStock ? 'warning' : 'success'}
                variant="outlined"
              />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
