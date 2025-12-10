/**
 * @file LowStockAlertSection.tsx
 * @module app/HamburgerMenu/NotificationSettings/LowStockAlertSection
 *
 * @summary
 * Displays low-stock alert with warning styling and item count.
 * Shows when low-stock items exist in inventory.
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
  /** Number of items with low stock */
  lowStockCount: number;
}

/**
 * Low-stock alert display component.
 *
 * Shows alert box with warning styling and chip with item count.
 *
 * @param props - Component props
 * @returns JSX element displaying low-stock alert
 */
export default function LowStockAlertSection({ lowStockCount }: LowStockAlertSectionProps) {
  const { t } = useTranslation('common');

  return (
    <>
      {/* Alert Box */}
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

      {/* Quick Stats Chip */}
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
