/**
 * @file Analytics.tsx
 * @description
 * Analytics landing page with global filters + three charts:
 *  1) Stock value over time (Line)
 *  2) Monthly stock movement (Bar: stockIn vs stockOut)
 *  3) Price trend for a selected item (Line)
 *
 * Phase A (A1/A2):
 * - Adds a top filter bar (quick 30/90/180 + custom dates + supplier)
 * - Pushes filter state to URL (?from=&to=&supplierId=)
 * - Hydrates state from URL on load / navigation
 */

import * as React from 'react';
import type { JSX } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Skeleton,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import {
  getStockValueOverTime,
  getMonthlyStockMovement,
  getTopItems,
  getPriceTrend,
  getSuppliersLite,
  type PricePoint,
  type ItemRef,
  type SupplierRef,
} from '../../api/analytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import Filters, { type AnalyticsFilters } from './components/Filters';
import { readParams, writeParams } from '../../utils/urlState';
import LowStockTable from './blocks/LowStockTable';
import StockPerSupplier from './blocks/StockPerSupplier';

export default function Analytics(): JSX.Element {
  const { t } = useTranslation(['analytics', 'common']);
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Returns today's date (local) formatted as yyyy-MM-dd. */
  function todayIso(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /** Utility: returns YYYY-MM-DD for N days ago, local time. */
  function daysAgoIso(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // ---------------------------------------------------------------------------
  // URL <-> State
  // ---------------------------------------------------------------------------

  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Seed filters from the URL once on mount.
   * - Defaults to last 180 days if range absent (BE requires start/end).
   * - `readParams` is robust to `supplierid` (lowercase) and strips quotes.
   */
  const [filters, setFilters] = React.useState<AnalyticsFilters>(() => {
    const m = readParams(searchParams.toString(), ['from', 'to', 'supplierId']);
    // If URL lacks from/to, default to last 180 days so BE gets required start/end.
    const haveRange = !!(m.from && m.to);
    return {
      from: haveRange ? m.from : daysAgoIso(180),
      to: haveRange ? m.to : todayIso(),
      supplierId: m.supplierId, // already sanitized by readParams
      quick: haveRange ? 'custom' : '180',
    };
  });

  /**
   * Keep the URL in sync with filter state so deep-links/bookmarks work.
   * - Uses a minimal diff (`writeParams`) to avoid churn.
   * - Avoids loops by comparing with the current search string.
   */
  React.useEffect(() => {
    const next = writeParams(searchParams.toString(), {
      from: filters.from,
      to: filters.to,
      supplierId: filters.supplierId, // canonical casing
    });
    const current = searchParams.toString();
    const canonicalCurrent = current ? `?${current}` : '';
    if (next !== canonicalCurrent) {
      setSearchParams(new URLSearchParams(next));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.supplierId]);

  // ---------------------------------------------------------------------------
  // Queries (now keyed by filters so caching respects changes)
  // ---------------------------------------------------------------------------

  // Suppliers for dropdown
  const suppliersQ = useQuery<SupplierRef[]>({
    queryKey: ['analytics', 'suppliers'],
    queryFn: getSuppliersLite,
    retry: 0,               // don't keep poking the server
    staleTime: 5 * 60_000,
  });

  // Stock value over time
  const stockValueQ = useQuery({
    queryKey: ['analytics', 'stockValue', filters.from, filters.to, filters.supplierId],
    queryFn: () => getStockValueOverTime(filters),
    retry: 0,
    staleTime: 60_000,
  });

  // Monthly stock movement
  const movementQ = useQuery({
    queryKey: ['analytics', 'movement', filters.from, filters.to, filters.supplierId],
    queryFn: () => getMonthlyStockMovement(filters),
  });

  // Item list (for price-trend dropdown)
  const itemsQ = useQuery<ItemRef[]>({
    queryKey: ['analytics', 'items'],
    queryFn: getTopItems,
  });

  // Selected item for price trend (keep stable across filter changes)
  const [selectedItemId, setSelectedItemId] = React.useState<string>('');

  // Price trend for the selected item (filters apply)
  const priceQ = useQuery<PricePoint[]>({
    queryKey: ['analytics', 'priceTrend', selectedItemId, filters.from, filters.to],
    queryFn: () => getPriceTrend(selectedItemId, filters),
    enabled: !!selectedItemId,
  });

  // Pick the first item automatically once items are loaded.
  React.useEffect(() => {
    if (!selectedItemId && itemsQ.data && itemsQ.data.length > 0) {
      setSelectedItemId(itemsQ.data[0].id);
    }
  }, [itemsQ.data, selectedItemId]);

  // ---------------------------------------------------------------------------
  // Derived data (sorted arrays so Recharts draw predictably)
  // ---------------------------------------------------------------------------

  const stockValueData = React.useMemo(
    () => [...(stockValueQ.data ?? [])].sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? '')),
    [stockValueQ.data]
  );

  const priceTrendData = React.useMemo(
    () => [...(priceQ.data ?? [])].sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? '')),
    [priceQ.data]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      {/* Header + "Back to Dashboard" */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">{t('analytics:title')}</Typography>
        <Button variant="text" onClick={() => navigate('/dashboard')}>
          {t('common:actions.backToDashboard')}
        </Button>
      </Stack>

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        <Filters
          value={filters}
          onChange={setFilters}
          suppliers={suppliersQ.data ?? []}
          disabled={suppliersQ.isLoading}
        />
      </Box>

      {/* Responsive cards grid:
         - 1 column on phones
         - 2 columns on small/medium screens
         - 3 columns on large screens and up */}
      <Box
        sx={{
        display: 'grid',
          gap: 2,
          // Auto-fit stretches cards to fill the row and collapses gaps naturally
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'stretch',
        }}
      >
        
        {/* ------------------------------------------------------------------- */}
        {/* Stock value over time                                               */}
        {/* ------------------------------------------------------------------- */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('analytics:cards.stockValue')}
            </Typography>

            {stockValueQ.isLoading ? (
              <Skeleton variant="rounded" height={220} />
            ) : stockValueQ.isError ? (
              <Box sx={{ height: 260, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                {t('analytics:cards.noData')}
              </Box>
            ) : stockValueData.length === 0 ? (
              <Box sx={{ height: 260, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                {t('analytics:cards.noData')}
              </Box>
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockValueData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="totalValue"
                      stroke={muiTheme.palette.primary.main}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------- */}
        {/* Monthly stock movement                                              */}
        {/* ------------------------------------------------------------------- */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('analytics:cards.monthlyMovement')}
            </Typography>

            {movementQ.isLoading ? (
              <Skeleton variant="rounded" height={220} />
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={movementQ.data ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="stockIn" fill={muiTheme.palette.success.main} />
                    <Bar dataKey="stockOut" fill={muiTheme.palette.error.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------- */}
        {/* Price trend for selected item                                       */}
        {/* ------------------------------------------------------------------- */}
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle1">{t('analytics:cards.priceTrend')}</Typography>

              <TextField
                select
                size="small"
                label={t('analytics:item')}
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                sx={{ minWidth: 260 }}
                disabled={itemsQ.isLoading || itemsQ.isError}
              >
                {!itemsQ.data || itemsQ.data.length === 0 ? (
                  <MenuItem disabled value="">
                    {t('analytics:cards.noItems')}
                  </MenuItem>
                ) : (
                  itemsQ.data.map((it) => (
                    <MenuItem key={it.id} value={it.id}>
                      {it.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Stack>

            {(!selectedItemId || priceQ.isLoading) ? (
              <Skeleton variant="rounded" height={220} />
            ) : priceQ.isError ? (
              <Box sx={{ height: 260, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                {t('analytics:cards.noData')}
              </Box>
            ) : (priceQ.data?.length ?? 0) === 0 ? (
              <Box sx={{ height: 260, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                {t('analytics:cards.noData')}
              </Box>
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={priceTrendData}
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                    key={selectedItemId}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={muiTheme.palette.primary.main}
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                      connectNulls
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>
        
        {/*
           Filters bar (controlled).
           - onChange={setFilters} updates `filters` (supplierId/from/to).
           - Our URL-sync effect mirrors those to the query string.
           - LowStockTable enables its fetch when supplierId is truthy.
        */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Filters
              value={filters}
              suppliers={suppliersQ.data ?? []}
              onChange={setFilters}
              disabled={suppliersQ.isLoading}
            />
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------- */}
        {/* Low stock items (per supplier)                                      */}
        {/* ------------------------------------------------------------------- */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('analytics.cards.lowStock', 'Low stock items')}
            </Typography>
            
            {/*
              LowStockTable only fires its query when `supplierId` is truthy.
              With the hardened urlState helpers + Filters, this will now light up
              as soon as a supplier is selected and URL shows `?supplierId=<id>`.
            */}
            <LowStockTable
              supplierId={filters.supplierId ?? ''}
              from={filters.from}
              to={filters.to}
              limit={12}
            />
          </CardContent>
        </Card>

        {/* Stock per supplier (snapshot) */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('analytics:stockPerSupplier.title')}
            </Typography>
            <StockPerSupplier />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
