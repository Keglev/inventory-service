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
import { Box, Typography, Stack, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { readParams } from '../../utils/urlState';
import { getSuppliersLite, type SupplierRef } from '../../api/analytics/suppliers';

// Blocks
import StockValueCard from './blocks/StockValueCard';
import MonthlyMovementCard from './blocks/MonthlyMovementCard';
import PriceTrendCard from './blocks/PriceTrendCard';
import LowStockTable from './blocks/LowStockTable';
import StockPerSupplier from './blocks/StockPerSupplier';
import AnalyticsNav, { type AnalyticsSection } from './components/AnalyticsNav';

// Filters UI
import Filters, { type AnalyticsFilters } from './components/Filters';


// Local date helpers (UI-only)
import { todayIso, daysAgoIso } from './utils/date';

export default function Analytics(): JSX.Element {
  const { t } = useTranslation(['analytics', 'common']);
  const navigate = useNavigate();
    // Read section from route: /analytics/:section?
  const { section: rawSection } = useParams();
  const section: AnalyticsSection =
    rawSection === 'pricing' || rawSection === 'inventory' ? rawSection : 'overview';
  
  // URL ↔ state
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = React.useState<AnalyticsFilters>(() => {
    const m = readParams(searchParams.toString(), ['from', 'to', 'supplierId']);
    const haveRange = !!(m.from && m.to);
    return {
      from: haveRange ? m.from : daysAgoIso(180),
      to: haveRange ? m.to : todayIso(),
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
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">{t('analytics:title')}</Typography>
          <Button variant="text" onClick={() => navigate('/dashboard')}>
            {t('common:actions.backToDashboard')}
          </Button>
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

            {/* A2 */}
            <MonthlyMovementCard from={filters.from} to={filters.to} supplierId={filters.supplierId} />
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

            {/* A4 — Stock per supplier snapshot */}
            <StockPerSupplier />
          </>
        )}
      </Box>
    </Box>
  );
}