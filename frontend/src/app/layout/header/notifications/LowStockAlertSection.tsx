/**
 * @file LowStockAlertSection.tsx
 * @module app/layout/header/notifications/LowStockAlertSection
 *
 * @summary
 * Renders the low-stock warning: the item count and a link to the list.
 *
 * @enterprise
 * - Mounted by NotificationsMenuSection when lowStockCount > 0.
 * - Contrast (S2-8): the warning tint behind the section lowers every colour on
 *   it. warning.main as title text read 2.64:1 in light mode and the default link
 *   blue 3.90:1 (light) / 3.95:1 (dark), below the 4.5:1 text minimum. The title
 *   takes the text token; the icon and the tint carry the warning.
 *
 * @example
 * ```tsx
 * <LowStockAlertSection lowStockCount={5} />
 * ```
 */

import { Link, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from 'react-i18next';
import { BELOW_MINIMUM_LINK } from '../../../../config/inventoryPolicy';

export interface LowStockAlertSectionProps {
  lowStockCount: number;
  /** Called when the user follows the link, so the popover can close. */
  onShowAll?: () => void;
}

// warning.main is a 2.64:1 icon on the light tint (graphics need 3:1); dark mode keeps it.
const iconColor = (theme: Theme) => (theme.palette.mode === 'light' ? theme.palette.warning.dark : theme.palette.warning.main);
// The default link blue falls below 4.5:1 on the tint in both modes.
const linkColor = (theme: Theme) => (theme.palette.mode === 'light' ? theme.palette.primary.dark : theme.palette.primary.light);

export default function LowStockAlertSection({ lowStockCount, onShowAll }: LowStockAlertSectionProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <Stack spacing={0.5} sx={{ p: 1, bgcolor: (theme) => alpha(theme.palette.warning.main, 0.15), borderRadius: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <NotificationsActiveIcon sx={{ fontSize: 20, color: iconColor }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('notifications.lowStockAlert')}
          </Typography>
        </Stack>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t(
            'notifications.lowStockMessage',
            { count: lowStockCount }
          )}
        </Typography>
        {/* The count alone named no items; this opens the list (C6). */}
        <Link component={RouterLink} to={BELOW_MINIMUM_LINK} onClick={onShowAll} variant="body2" underline="hover" sx={{ color: linkColor }}>
          {t('notifications.showAll')}
        </Link>
      </Stack>
    </>
  );
}
