/**
* @file Analytics.tsx
* @module pages/analytics/Analytics
*
* @summary
* Orchestrates Analytics blocks with a global filter bar and URL sync.
* Splitting into blocks keeps this file under ~200 lines and easier to reason.
*/
import * as React from 'react';
import type { JSX } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Box, Typography, Stack, Button, Paper } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { readParams } from '../../utils/urlState';
import { getSuppliersLite, type SupplierRef } from '../../api/analytics/suppliers';
import { HelpIconButton } from '../../features/help';

// Blocks
import StockValueCard from './blocks/StockValueCard';
import PriceTrendCard from './blocks/PriceTrendCard';
import LowStockTable from './blocks/LowStockTable';
import StockPerSupplierDonut from './blocks/StockPerSupplierDonut';
import AnalyticsNav, { type AnalyticsSection } from './components/AnalyticsNav';
import FinancialSummaryCard from './blocks/FinancialSummaryCard';
import ItemUpdateFrequencyCard from './blocks/ItemUpdateFrequencyCard';
import RecentStockActivityCard from './blocks/RecentStockActivityCard';
import MovementLineCard from './blocks/MovementLineCard';

// Filters UI
import { Filters, type AnalyticsFilters } from './components/filters';

// Import date helpers from the standard utils location
import { getTodayIso, getDaysAgoIso } from '../../utils/formatters';

export default function Analytics(): JSX.Element {
  const { t } = useTranslation(['analytics', 'common']);
  const navigate = useNavigate();
    // Read section from route: /analytics/:section?
  const { section: rawSection } = useParams();
  const section: AnalyticsSection =
    rawSection === 'pricing' || rawSection === 'inventory' || rawSection === 'finance'
      ? (rawSection as AnalyticsSection)
      : 'overview';
  
  // URL ↔ state
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = React.useState<AnalyticsFilters>(() => {
    const m = readParams(searchParams.toString(), ['from', 'to', 'supplierId']);
    const haveRange = !!(m.from && m.to);
    return {
      from: haveRange ? m.from : getDaysAgoIso(180),
      to: haveRange ? m.to : getTodayIso(),
      supplierId: m.supplierId,
      quick: haveRange ? 'custom' : '180',
    };
  });
  React.useEffect(() => {
    const next: Record<string, string> = {};
    if (filters.from) next.from = filters.from;
    if (filters.to) next.to = filters.to;
    if (filters.supplierId) next.supplierId = filters.supplierId;
    setSearchParams(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.supplierId]);
  
  
  // Suppliers list
  const suppliersQ = useQuery<SupplierRef[]>({
    queryKey: ['analytics', 'suppliers'],
    queryFn: getSuppliersLite,
    retry: 0,
    staleTime: 5 * 60_000,
  });
  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.paper', m: 0 }}>
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="space-between" 
        sx={{ mb: 3 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('analytics:title')}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <HelpIconButton
            topicId="analytics.overview"
            tooltip={t('actions.help', 'Help')}
          />
          <Button variant="text" onClick={() => navigate('/dashboard')}>
            {t('common:actions.backToDashboard')}
          </Button>
        </Stack>
      </Stack>
      {/* Submenu (tabs) */}
        <AnalyticsNav section={section} />  
      <Box sx={{ mb: 2 }}>
          <Filters value={filters} onChange={setFilters} suppliers={suppliersQ.data ?? []} disabled={suppliersQ.isLoading} />
      </Box>
            <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'stretch',
        }}
      >
        {section === 'overview' && (
          <>
            {/* A1 */}
            <StockValueCard from={filters.from} to={filters.to} supplierId={filters.supplierId} />

            {/* A2 (Line) */}
            <MovementLineCard from={filters.from} to={filters.to} supplierId={filters.supplierId} />
          </>
        )}

        {section === 'pricing' && (
          <>
            {/* A3 */}
            <PriceTrendCard from={filters.from} to={filters.to} supplierId={filters.supplierId} />
          </>
        )}

        {section === 'inventory' && (
          <>
            {/* A4 — Low stock table (fetch gated by supplier) */}
            <LowStockTable supplierId={filters.supplierId ?? ''} from={filters.from} to={filters.to} limit={12} />

            {/* A4 — Stock per supplier (donut) */}
            <StockPerSupplierDonut />
          </>
        )}
        {section === 'finance' && (
          <>
            {/* Finance — WAC summary (period + supplier) */}
            <FinancialSummaryCard from={filters.from} to={filters.to} supplierId={filters.supplierId} />

            {/* Operations — top updated items (requires supplier) */}
            <ItemUpdateFrequencyCard supplierId={filters.supplierId} />

            {/* Operations — recent stock activity (stacked by reason) */}
            <RecentStockActivityCard from={filters.from} to={filters.to} supplierId={filters.supplierId} />
          </>
        )}
      </Box>
    </Paper>
  );
}