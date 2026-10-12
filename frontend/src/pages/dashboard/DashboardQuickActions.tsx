/**
 * @file DashboardQuickActions.tsx
 * @module pages/dashboard/DashboardQuickActions
 *
 * @summary
 * The dashboard's three shortcuts (inventory, suppliers, analytics) as small
 * buttons for the title row.
 *
 * @enterprise
 * - They sat below the four chart cards, where a desktop user had to scroll to
 *   find them and their outlined style barely showed (FW6, 2026-10-09). In the
 *   title row they are visible without scrolling and take no height of their own.
 * - Below the sm breakpoint the long labels ("Lieferanten verwalten") do not fit
 *   three across, so the buttons show the navigation labels instead, the same
 *   words as the sidebar, and share the row equally.
 *
 * @i18n
 * Uses 'common' namespace. Keys: dashboard.actions.manageInventory,
 * dashboard.actions.manageSuppliers, dashboard.actions.viewAnalytics,
 * nav.inventory, nav.suppliers, nav.analytics.
 */
import { Button, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

/**
 * Shortcut buttons for the dashboard header.
 *
 * @returns three small buttons; contained for inventory, outlined for the rest
 */
export default function DashboardQuickActions() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  const actions = [
    { to: '/inventory', full: 'dashboard.actions.manageInventory', short: 'nav.inventory' },
    { to: '/suppliers', full: 'dashboard.actions.manageSuppliers', short: 'nav.suppliers' },
    { to: '/analytics/overview', full: 'dashboard.actions.viewAnalytics', short: 'nav.analytics' },
  ] as const;

  return (
    <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
      {actions.map((action, index) => (
        <Button
          key={action.to}
          size="small"
          variant={index === 0 ? 'contained' : 'outlined'}
          onClick={() => navigate(action.to)}
          sx={{ flex: { xs: 1, sm: 'none' } }}
        >
          {t(isPhone ? action.short : action.full)}
        </Button>
      ))}
    </Stack>
  );
}
