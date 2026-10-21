/**
 * @file LowStockAlertSection.tsx
 * @module app/layout/header/notifications/LowStockAlertSection
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

import { Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from 'react-i18next';
import { BELOW_MINIMUM_LINK } from '../../../../config/inventoryPolicy';

export interface LowStockAlertSectionProps {
  lowStockCount: number;
  /** Called when the user follows the link, so the popover can close. */
  onShowAll?: () => void;
}

export default function LowStockAlertSection({ lowStockCount, onShowAll }: LowStockAlertSectionProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <Stack spacing={0.5} sx={{ p: 1, bgcolor: (theme) => alpha(theme.palette.warning.main, 0.15), borderRadius: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <NotificationsActiveIcon sx={{ fontSize: 20, color: 'warning.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main' }}>
            {t('notifications.lowStockAlert')}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {t(
            'notifications.lowStockMessage',
            { count: lowStockCount }
          )}
        </Typography>
        {/* The count alone named no items; this opens the list (C6). */}
        <Link component={RouterLink} to={BELOW_MINIMUM_LINK} onClick={onShowAll} variant="body2" underline="hover">
          {t('notifications.showAll')}
        </Link>
      </Stack>
    </>
  );
}
