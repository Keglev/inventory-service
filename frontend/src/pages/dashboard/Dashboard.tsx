/**
 * @file Dashboard.tsx
 * @module pages/dashboard/Dashboard
 *
 * @summary
 * Authenticated landing page. Renders three KPI cards (inventory count,
 * suppliers count, low-stock count), a 90-day stock-movement mini chart,
 * and primary navigation buttons for the core workflows.
 *
 * @enterprise
 * - Resilience: KPI cards degrade to em-dash placeholders when their data
 *   source is unavailable, so a partial backend outage does not blank the
 *   page or fall through to an error boundary.
 * - The mini chart reuses the analytics API (getMonthlyStockMovement) rather
 *   than a dashboard-specific endpoint, keeping a single source of truth
 *   for stock-movement aggregation logic.
 * - Help-icon integration uses the shared HelpIconButton with topicId
 *   "app.main"; topic content lives in the help registry, not in this page.
 *
 * @i18n
 * Uses 'common' namespace. Keys: dashboard.title, dashboard.kpi.totalItems,
 * dashboard.kpi.suppliers, dashboard.kpi.lowStock, dashboard.actions.*,
 * actions.help.
 *
 * CB-APP66: t('actions.help', 'Help') retains an English fallback string at
 * the JSX site — tracked for the i18n cleanup pass.
 */
import * as React from 'react';
import { Box, Grid, Button, Stack, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDashboardMetrics } from '../../api/analytics/hooks/useDashboardMetrics';
import MonthlyMovementMini from './blocks/MonthlyMovementMini';
import StatCard from '../../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';
import { HelpIconButton } from '../../features/help/components/HelpIconButton';

/**
 * Dashboard page component.
 * Provides KPI overview, trending chart, and navigation shortcuts.
 * Resilient to partial API failures (missing KPI data shows "—").
 * @returns React component with grid layout of cards and action buttons
 */
const Dashboard: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  // Fetch all KPI metrics in a single query with cache durability
  const metricsQuery = useDashboardMetrics(true);

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        m: 0,
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 2, md: 3 },
          pt: { xs: 1.5, md: 2 },
          pb: { xs: 2, md: 3 },
        }}
      >
        {/* Header with title and help button */}
        <Box
          sx={{
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('dashboard.title')}
          </Typography>

          <HelpIconButton topicId="app.main" tooltip={t('actions.help')} />
        </Box>

        {/* KPI metrics grid: Total inventory, suppliers count, low stock count */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              title={t('dashboard.kpi.totalItems')}
              value={metricsQuery.data?.inventoryCount}
              loading={metricsQuery.isLoading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              title={t('dashboard.kpi.suppliers')}
              value={metricsQuery.data?.suppliersCount}
              loading={metricsQuery.isLoading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <StatCard
              title={t('dashboard.kpi.lowStock')}
              value={metricsQuery.data?.lowStockCount}
              loading={metricsQuery.isLoading}
            />
          </Grid>
        </Grid>

        {/* Trending chart: Monthly stock movement over last 90 days */}
        <Box sx={{ mb: 2 }}>
          <MonthlyMovementMini />
        </Box>

        {/* Action buttons for main workflows (responsive layout) */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ mt: 'auto', pt: 1 }}
        >
          <Button variant="contained" onClick={() => navigate('/inventory')}>
            {t('dashboard.actions.manageInventory')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/suppliers')}>
            {t('dashboard.actions.manageSuppliers')}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/analytics/overview')}>
            {t('dashboard.actions.viewAnalytics')}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};

export default Dashboard;
