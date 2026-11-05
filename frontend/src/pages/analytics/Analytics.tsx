/**
 * @file Analytics.tsx
 * @module pages/analytics/Analytics
 *
 * @summary
 * Orchestrates the Analytics page: a global filter bar, route-driven section navigation,
 * and a responsive grid of analytics blocks.
 *
 * @enterprise
 * - Thin by design: each visual concern is a dedicated block component.
 * - URL is the single source of truth for filters. State is hydrated
 *   from the URL on mount and synced back to the URL on every filter
 *   change (one-way state -> URL effect). This keeps deep-links and
 *   browser back/forward navigation correct.
 * - Default window is 180 days back. URL params override the defaults
 *   only when both `from` and `to` are present; otherwise defaults
 *   apply and the quick selector is set to '180'.
 * - Section is read from the route segment `/analytics/:section?`.
 *   Valid values: 'overview' | 'movements' | 'pricing' | 'inventory' |
 *   'finance' | 'employees'. Any unknown value falls back to 'overview'.
 *   The employees section shows its charts to ADMIN and the demo session
 *   only; for any other user it shows a notice and the filters are inert.
 * - The suppliers list is the shared supplier list query (1-minute
 *   staleTime), passed to the filter bar's supplier picker.
 * - Each section renders a different subset of blocks; the grid uses
 *   `auto-fit` + `minmax(320px, 1fr)` so the layout reflows from one
 *   column on mobile to multiple columns on wide viewports.
 */
import * as React from 'react';
import type { JSX } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Alert, Box, Typography, Stack, Button, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { readParams } from '../../utils/urlState';
import { useSupplierListQuery } from '../../api/suppliers/hooks/useSupplierListQuery';
import { HelpIconButton } from '../../features/help/components/HelpIconButton';
import { useAuth } from '../../hooks/useAuth';

// Blocks
import StockValueCard from './blocks/StockValueCard';
import PriceTrendCard from './blocks/PriceTrendCard';
import LowStockTable from './blocks/LowStockTable';
import StockValuePerSupplierPie from './blocks/StockValuePerSupplierPie';
import AnalyticsNav, { type AnalyticsSection } from './components/AnalyticsNav';
import FinancialSummaryCard from './blocks/FinancialSummaryCard';
import ItemUpdateFrequencyCard from './blocks/ItemUpdateFrequencyCard';
import RecentStockActivityCard from './blocks/RecentStockActivityCard';
import MovementLineCard from './blocks/MovementLineCard';
import MovementsSection from './sections/MovementsSection';
import EmployeesSection from './sections/EmployeesSection';

import { Filters } from './components/filters/Filters';
import type { AnalyticsFilters } from './components/filters/Filters.types';

import { getTodayIso, getDaysAgoIso } from '../../utils/formatters';
import { pagePanelSx, railGutter } from '../../theme/pagePanel';

export default function Analytics(): JSX.Element {
  const { t } = useTranslation(['analytics', 'common']);
  const navigate = useNavigate();
  const { user } = useAuth();
  // Employees analytics is a supervision view: ADMIN and the demo session see it;
  // any other signed-in user gets a notice and inert filters (backend ADR-0020).
  const canSeeEmployees = user?.role === 'ADMIN' || user?.isDemo === true;
    // Read section from route: /analytics/:section?
  const { section: rawSection } = useParams();
  const section: AnalyticsSection =
    rawSection === 'pricing' || rawSection === 'inventory' || rawSection === 'finance' || rawSection === 'movements'
      ? (rawSection as AnalyticsSection)
      : rawSection === 'employees'
        ? 'employees'
        : 'overview';
  const employeesLocked = section === 'employees' && !canSeeEmployees;
  
  // URL <-> state
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setSearchParams is stable (React Router) but ESLint cannot prove it
  }, [filters.from, filters.to, filters.supplierId]);
  
  
  // Suppliers list: the shared entry, so supplier writes refresh the filter
  const suppliersQ = useSupplierListQuery();
  // The window and supplier every date-aware card receives.
  const scope = { from: filters.from, to: filters.to, supplierId: filters.supplierId };
  return (
    <Paper elevation={0} sx={{ ...pagePanelSx, p: { xs: 2, md: 3 }, pl: railGutter, pr: railGutter, bgcolor: 'background.paper', m: 0 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('analytics:title')}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <HelpIconButton
            topicId="analytics.overview"
            tooltip={t('common:actions.help')}
          />
          <Button variant="text" onClick={() => navigate('/dashboard')}>
            {t('common:actions.backToDashboard')}
          </Button>
        </Stack>
      </Stack>
      {/* Submenu (tabs) */}
      <AnalyticsNav section={section} />
      <Box sx={{ mb: 2 }}>
          <Filters value={filters} onChange={setFilters} suppliers={suppliersQ.data ?? []} disabled={suppliersQ.isLoading || employeesLocked} />
      </Box>
      <Box
  sx={{
    display: 'grid',
    gap: 2,
    // The inventory-health section gives the low-stock table ~3/5 of the width (its
    // fixed-layout table needs ~640px for the Status chips without horizontal scroll)
    // and the supplier pie ~2/5; other sections keep the responsive auto-fit grid.
    gridTemplateColumns:
      section === 'inventory'
        ? { xs: '1fr', md: 'minmax(0, 3fr) minmax(280px, 2fr)' }
        : 'repeat(auto-fit, minmax(320px, 1fr))',
    alignItems: 'stretch',
  }}
>
  {section === 'overview' && (
    <>
      <StockValueCard {...scope} />

      <MovementLineCard {...scope} />
    </>
  )}

  {section === 'movements' && (
    <MovementsSection {...scope} />
  )}

  {section === 'employees' && (
    employeesLocked ? (
      <Alert severity="info" sx={{ gridColumn: '1 / -1' }}>{t('analytics:employees.restricted')}</Alert>
    ) : <EmployeesSection {...scope} />
  )}

  {section === 'pricing' && (
    <>
      <PriceTrendCard {...scope} />
    </>
  )}

  {section === 'inventory' && (
    <>
      <LowStockTable supplierId={filters.supplierId ?? ''} limit={12} />

      <StockValuePerSupplierPie dateScopeNote />
    </>
  )}
  {section === 'finance' && (
    <>
      {/* Finance — WAC summary (period + supplier) */}
      <FinancialSummaryCard {...scope} />

      {/* Operations — top updated items (requires supplier) */}
      <ItemUpdateFrequencyCard supplierId={filters.supplierId} />

      {/* Operations — recent stock activity (stacked by reason) */}
      <RecentStockActivityCard {...scope} />
    </>
  )}
</Box>
    </Paper>
  );
}