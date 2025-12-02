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
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import httpClient from '../../api/httpClient';

  export interface LowStockItem {
  id: string;
  name: string;
  onHand: number;
  minQty: number | null;
  supplierId?: string;
  category?: string;
}

export default function NotificationsMenuSection() {
  const { t } = useTranslation(['common', 'analytics']);

  // Fetch low-stock count from backend
  const q = useQuery<LowStockItem[]>({
    queryKey: ['notifications', 'lowStock'],
    queryFn: async () => {
        const res = await httpClient.get('/analytics/low-stock-items'); // keep your real URL
        return res.data as LowStockItem[];
    },
    staleTime: 30_000,
    retry: 1,
    });

    // Derive count + flag from the array
    const lowStockItems = q.data ?? [];
    const lowStockCount = lowStockItems.length;
    const hasLowStock = lowStockCount > 0;

  return (
    <>
      {hasLowStock ? (
        <>
          {/* ALERT SECTION */}
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

          {/* QUICK STATS */}
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
