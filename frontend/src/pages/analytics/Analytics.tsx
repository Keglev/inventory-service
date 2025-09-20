/**
 * @file Analytics.tsx
 * @module pages/analytics/Analytics
 *
 * @summary
 * Analytics landing page with:
 *  1) Stock value over time (Line)
 *  2) Monthly stock movement (Bar: stockIn vs stockOut)
 *  3) Price trend for a selected item (Line)
 *  4) Low-stock table (per supplier)
 *  5) Stock per supplier (snapshot)
 *
 * @remarks
 * - Global Filters bar (quick 30/90/180 + custom dates + supplier) controls all cards.
 * - Filters are mirrored to the URL (`?from=&to=&supplierId=`) and hydrated on load.
 * - Price Trend item selector is a supplier-scoped **type-ahead**:
 *     - We fetch items for the selected supplier (`getItemsForSupplier`).
 *     - We debounce a text query and filter client-side to show only matches.
 *     - This avoids giant dropdowns and guarantees items belong to that supplier.
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
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import {
  getStockValueOverTime,
  getMonthlyStockMovement,
  getPriceTrend,
  getSuppliersLite,
  getItemsForSupplier,
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
import { readParams } from '../../utils/urlState';
import LowStockTable from './blocks/LowStockTable';
import StockPerSupplier from './blocks/StockPerSupplier';

/** Returns today's date (local) formatted as `yyyy-MM-dd`. @internal */
function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Returns `yyyy-MM-dd` for N days ago (local). @internal */
function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Debounce a string value by `ms` milliseconds.
 * @param value - Current value
 * @param ms - Debounce delay in ms (default 250)
 * @returns Debounced value
 * @internal
 */
function useDebounced(value: string, ms = 250): string {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const h = setTimeout(() => setV(value), ms);
    return () => clearTimeout(h);
  }, [value, ms]);
  return v;
}

export default function Analytics(): JSX.Element {
  const { t } = useTranslation(['analytics', 'common']);
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();

  // ---------------------------------------------------------------------------
  // URL <-> State
  // ---------------------------------------------------------------------------

  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Seed filters from the URL once on mount.
   * - Defaults to last 180 days if range absent (BE requires start/end).
   * - `readParams` is robust to `supplierid` (lowercase) and strips accidental quotes.
   */
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

  /**
   * Keep the URL in sync with filter state so deep-links/bookmarks work.
   * Replaces the whole query string with the current canonical set.
   */
  React.useEffect(() => {
    const next: Record<string, string> = {};
    if (filters.from) next.from = filters.from;
    if (filters.to) next.to = filters.to;
    if (filters.supplierId) next.supplierId = filters.supplierId;
    setSearchParams(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.supplierId]);

  // ---------------------------------------------------------------------------
  // Queries (keyed by filters so caching respects changes)
  // ---------------------------------------------------------------------------

  /** Supplier options for the global dropdown. */
  const suppliersQ = useQuery<SupplierRef[]>({
    queryKey: ['analytics', 'suppliers'],
    queryFn: getSuppliersLite,
    retry: 0,
    staleTime: 5 * 60_000,
  });

  /** Stock value over time (range + supplier-aware). */
  const stockValueQ = useQuery({
    queryKey: ['analytics', 'stockValue', filters.from, filters.to, filters.supplierId],
    queryFn: () => getStockValueOverTime(filters),
    retry: 0,
    staleTime: 60_000,
  });

  /** Monthly stock movement (range + supplier-aware). */
  const movementQ = useQuery({
    queryKey: ['analytics', 'movement', filters.from, filters.to, filters.supplierId],
    queryFn: () => getMonthlyStockMovement(filters),
  });

  // ---------------------------------------------------------------------------
  // Price Trend: supplier-scoped type-ahead for items
  // ---------------------------------------------------------------------------

  /** Controlled text the user types in the item search box. */
  const [itemQuery, setItemQuery] = React.useState<string>('');
  const debouncedQuery = useDebounced(itemQuery, 250);

  /** Selected item id for the Price Trend chart. */
  const [selectedItemId, setSelectedItemId] = React.useState<string>('');

  /**
   * Fetch the **supplier's items only**.
   * - If BE supports it, `getItemsForSupplier` returns the scoped list.
   * - We then client-filter by the debounced query to drive the type-ahead.
   */
  const itemsForSupplierQ = useQuery<ItemRef[]>({
    queryKey: ['analytics', 'itemsBySupplier', filters.supplierId ?? null],
    queryFn: () =>
      filters.supplierId ? getItemsForSupplier(filters.supplierId, 500) : Promise.resolve([]),
    enabled: !!filters.supplierId,
    staleTime: 60_000,
  });

  /**
   * Client-side filter over the supplier's items using the debounced query.
   * @enterprise
   * - Starts-with / contains match keeps it simple; can be swapped to a fuzzy match later.
   * - We limit to 50 shown options for snappy UX.
   */
  const itemOptions: ItemRef[] = React.useMemo(() => {
    const base = itemsForSupplierQ.data ?? [];
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return base.slice(0, 50);
    return base.filter((it) => it.name.toLowerCase().includes(q)).slice(0, 50);
  }, [itemsForSupplierQ.data, debouncedQuery]);

  /** Reset search + selection whenever the supplier changes. */
  React.useEffect(() => {
    setItemQuery('');
    setSelectedItemId('');
  }, [filters.supplierId]);

  /**
   * Auto-pick the first available option when:
   * - there's no current selection, and
   * - the (filtered) options list becomes non-empty.
   */
  React.useEffect(() => {
    if (!selectedItemId && itemOptions.length > 0) {
      setSelectedItemId(itemOptions[0].id);
    }
  }, [itemOptions, selectedItemId]);

  /** Price trend for the selected item (range-aware). */
  const priceQ = useQuery<PricePoint[]>({
    queryKey: ['analytics', 'priceTrend', selectedItemId, filters.from, filters.to],
    queryFn: () => getPriceTrend(selectedItemId, filters),
    enabled: !!selectedItemId, // chart only fetches once an item is chosen/auto-picked
  });

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

      {/* Filters (global) */}
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

              {!filters.supplierId ? (
                <Typography variant="body2" color="text.secondary">
                  {t('analytics:priceTrend.selectSupplier')}
                </Typography>
              ) : (
                <Autocomplete<ItemRef, false, false, false>
                  sx={{ minWidth: 320 }}
                  options={itemOptions}
                  getOptionLabel={(o: ItemRef) => o.name}
                  loading={itemsForSupplierQ.isLoading}
                  value={itemOptions.find((it) => it.id === selectedItemId) || null}
                  onChange={(_e: React.SyntheticEvent, val: ItemRef | null) =>
                    setSelectedItemId(val?.id ?? '')
                  }
                  inputValue={itemQuery}
                  onInputChange={(_e: React.SyntheticEvent, val: string) => setItemQuery(val)}
                  // server/our memo already filtered
                  filterOptions={(x: ItemRef[]) => x}
                  renderInput={(params: AutocompleteRenderInputParams) => (
                    <TextField
                      {...params}
                      size="small"
                      label={t('analytics:item')}
                      placeholder={t('analytics:priceTrend.selectSupplierShort')}
                    />
                  )}
                  noOptionsText={
                    debouncedQuery
                      ? t('analytics:priceTrend.noItemsForSupplier')
                      : t('analytics:priceTrend.selectSupplierShort')
                  }
                />
              )}
            </Stack>

            {/* Chart area */}
            {!filters.supplierId ? (
              <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                {t('analytics:priceTrend.selectSupplierShort', 'Select a supplier')}
              </Box>
            ) : !selectedItemId || priceQ.isLoading ? (
              <Skeleton variant="rounded" height={220} />
            ) : priceQ.isError ? (
              <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                {t('analytics:cards.noData')}
              </Box>
            ) : (priceQ.data?.length ?? 0) === 0 ? (
              <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
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

        {/* ------------------------------------------------------------------- */}
        {/* Low stock items (per supplier)                                      */}
        {/* ------------------------------------------------------------------- */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('analytics.cards.lowStock', 'Low stock items')}
            </Typography>

            {/* LowStockTable fetch is gated by a truthy supplierId */}
            <LowStockTable
              supplierId={filters.supplierId ?? ''}
              from={filters.from}
              to={filters.to}
              limit={12}
            />
          </CardContent>
        </Card>

        {/* ------------------------------------------------------------------- */}
        {/* Stock per supplier (snapshot)                                       */}
        {/* ------------------------------------------------------------------- */}
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
