/**
 * @file Analytics.tsx
 * @module pages/analytics/Analytics
 *
 * @summary
 * Orchestrates the Analytics page: a global filter bar, route-driven
 * section navigation, and a responsive grid of analytics blocks. The
 * file is intentionally kept thin (under ~200 lines) by delegating each
 * visual concern to a dedicated block component.
 *
 * @enterprise
 * - URL is the single source of truth for filters. State is hydrated
 *   from the URL on mount and synced back to the URL on every filter
 *   change (one-way state -> URL effect). This keeps deep-links and
 *   browser back/forward navigation correct.
 * - Default window is 180 days back. URL params override the defaults
 *   only when both `from` and `to` are present; otherwise defaults
 *   apply and the quick selector is set to '180'.
 * - Section is read from the route segment `/analytics/:section?`.
 *   Valid values: 'overview' | 'pricing' | 'inventory' | 'finance'.
 *   Any unknown value falls back to 'overview'.
 * - The suppliers list is fetched once with a 5-minute staleTime and
 *   is reused by both the supplier filter dropdown and the price-trend
 *   item search inside PriceTrendCard.
 * - Each section renders a different subset of blocks; the grid uses
 *   `auto-fit` + `minmax(320px, 1fr)` so the layout reflows from one
 *   column on mobile to multiple columns on wide viewports.
 * - The eslint-disable on the URL-sync effect is deliberate:
 *   `setSearchParams` is referentially stable per React Router but
 *   ESLint cannot prove it. Including it in the dep array would
 *   trigger an extra re-sync without changing behavior.
 */
import * as React from 'react';
import type { JSX } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Box, Typography, Stack, Button, Paper } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { readParams } from '../../utils/urlState';
import { getSuppliersLite, type SupplierRef } from '../../api/analytics/suppliers';
import { HelpIconButton } from '../../features/help/components/HelpIconButton';
import { useAuth } from '../../hooks/useAuth';

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
import MovementsSection from './sections/MovementsSection';
import EmployeesSection from './sections/EmployeesSection';

// Filters UI
import { Filters } from './components/filters/Filters';
import type { AnalyticsFilters } from './components/filters/Filters.types';

// Import date helpers from the standard utils location
import { getTodayIso, getDaysAgoIso } from '../../utils/formatters';

export default function Analytics(): JSX.Element {
  const { t } = useTranslation(['analytics', 'common']);
  const navigate = useNavigate();
  const { user } = useAuth();
  // Employees analytics is a supervision view: ADMIN role or the demo session only.
  const showEmployees = user?.role === 'ADMIN' || user?.isDemo === true;
    // Read section from route: /analytics/:section?
  const { section: rawSection } = useParams();
  const section: AnalyticsSection =
    rawSection === 'pricing' || rawSection === 'inventory' || rawSection === 'finance' || rawSection === 'movements'
      ? (rawSection as AnalyticsSection)
      : rawSection === 'employees' && showEmployees
        ? 'employees'
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
        <AnalyticsNav section={section} showEmployees={showEmployees} />  
      <Box sx={{ mb: 2 }}>
          <Filters value={filters} onChange={setFilters} suppliers={suppliersQ.data ?? []} disabled={suppliersQ.isLoading} />
      </Box>
            <Box
        sx={{
          display: 'grid',
          gap: 2,
          // CB-APP78: the inventory-health section gives the low-stock table
          // ~3/5 of the width (its fixed-layout table needs ~640px to show the
          // Status chips without horizontal scroll) and the donut ~2/5.
          // Other sections keep the responsive auto-fit grid.
          gridTemplateColumns:
            section === 'inventory'
              ? { xs: '1fr', md: 'minmax(0, 3fr) minmax(280px, 2fr)' }
              : 'repeat(auto-fit, minmax(320px, 1fr))',
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

        {section === 'movements' && (
          <MovementsSection from={filters.from} to={filters.to} supplierId={filters.supplierId} />
        )}

        {section === 'employees' && (
          <EmployeesSection from={filters.from} to={filters.to} supplierId={filters.supplierId} />
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