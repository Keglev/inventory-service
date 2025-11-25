/**
 * @file Dashboard.tsx
 * @description
 * Dashboard foundation with KPI cards and action shortcuts. KPIs are resilient:
 * if endpoints are missing/not ready, cards show "—" instead of breaking.
 *
 * @i18n
 * Uses 'common' namespace: dashboard.title, dashboard.kpi.*, dashboard.actions.*
 */
import * as React from 'react';
import { Box, Grid, Button, Stack, Typography, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getInventoryCount, getSuppliersCount, getLowStockCount } from '../../api/metrics';
import MonthlyMovementMini from './blocks/MonthlyMovementMini';
import StatCard from '../../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const invQ = useQuery({ queryKey: ['kpi', 'inventoryCount'], queryFn: getInventoryCount });
  const supQ = useQuery({ queryKey: ['kpi', 'suppliersCount'], queryFn: getSuppliersCount });
  const lowQ = useQuery({ queryKey: ['kpi', 'lowStockCount'], queryFn: getLowStockCount });

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.paper', m: 0 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        {t('dashboard.title')}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title={t('dashboard.kpi.totalItems')}
            value={invQ.data}
            loading={invQ.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title={t('dashboard.kpi.suppliers')}
            value={supQ.data}
            loading={supQ.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatCard
            title={t('dashboard.kpi.lowStock')}
            value={lowQ.data}
            loading={lowQ.isLoading}
          />
        </Grid>
      </Grid>
      {/* Compact chart: Monthly movement (90d) */}
      <Box sx={{ mb: 2 }}>
        <MonthlyMovementMini />
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
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
    </Paper>
  );
};

export default Dashboard;
