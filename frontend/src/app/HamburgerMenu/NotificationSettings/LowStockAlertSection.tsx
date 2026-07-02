/**
 * @file LowStockAlertSection.tsx
 * @module app/HamburgerMenu/NotificationSettings/LowStockAlertSection
 *
 * @summary
 * Renders the warning Stack + chip with the low-stock item count.
 *
 * @enterprise
 * - Mounted by NotificationsMenuSection when lowStockCount > 0.
 *
 * @example
 * ```tsx
 * <LowStockAlertSection lowStockCount={5} />
 * ```
 */

import { Stack, Typography, Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from 'react-i18next';

interface LowStockAlertSectionProps {
  lowStockCount: number;
}

export default function LowStockAlertSection({ lowStockCount }: LowStockAlertSectionProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <Stack spacing={0.5} sx={{ p: 1, bgcolor: (theme) => alpha(theme.palette.warning.main, 0.15), borderRadius: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <NotificationsActiveIcon sx={{ fontSize: 20, color: 'warning.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
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
