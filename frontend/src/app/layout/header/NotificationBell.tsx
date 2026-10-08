/**
 * @file NotificationBell.tsx
 * @module app/layout/header/NotificationBell
 * @summary Header bell with the below-minimum count as a badge; the popover shows the warning once.
 * @enterprise
 * - SAP, Carbon and ServiceNow place notifications behind a bell in the header
 *   (FW5 fork 7); before, the warning sat inside the user menu with its count twice.
 * - Reads useDashboardMetrics, the query the dashboard already caches, so the bell
 *   adds no request.
 */
import * as React from 'react';
import { Badge, IconButton, Popover, Box, Tooltip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTranslation } from 'react-i18next';
import { useDashboardMetrics } from '../../../api/analytics/hooks/useDashboardMetrics';
import NotificationsMenuSection from '../../HamburgerMenu/NotificationsMenuSection';

export default function NotificationBell() {
  const { t } = useTranslation(['common']);
  const q = useDashboardMetrics();
  const count = q.data?.lowStockCount ?? 0;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  return (
    <>
      <Tooltip title={t('notifications.title')}>
        <IconButton color="inherit" size="small" onClick={(e) => setAnchorEl(e.currentTarget)} aria-label={t('notifications.title')}>
          <Badge badgeContent={count} color="warning" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 1.5, maxWidth: 320 }}>
          <NotificationsMenuSection />
        </Box>
      </Popover>
    </>
  );
}
