/**
 * @file Analytics.tsx
 * @module pages/analytics/Analytics
 *
 * @summary
 * Analytics landing page with:
 *  1) Stock value over time (Line)
 *  2) Monthly stock movement (Bar: stockIn vs stockOut)
 *  3) Price trend for a selected item (Line) — with **type-ahead**
 *     - If NO supplier is selected → global search (DB-wide) on typed text.
 *     - If a supplier IS selected → supplier-scoped search on typed text.
 *  4) Low-stock table (per supplier)
 *  5) Stock per supplier (snapshot)
 *
 * @remarks
 * - Global filter bar (quick 30/90/180, custom dates, supplier) drives the cards.
 * - Filters mirror into the URL (`?from=&to=&supplierId=`) for deep-links.
 * - Price Trend selector is a **true** type-ahead:
 *   - We only call the server after a short debounce.
 *   - We always apply **client-side** narrowing by supplier + query to be correct
 *     even when the backend returns an unfiltered list.
 *   - No auto-selection; the user explicitly picks an item.
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
  searchItemsForSupplier,
  searchItemsGlobal,
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
 * @param value Current value.
 * @param ms Debounce delay (default 250ms).
 * @returns Debounced value.
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

/**
 * Local narrow type that extends ItemRef with an optional supplierId.
 * @enterprise
 * - We use this **only** inside the page to apply client-side scoping by supplier
 *   even if the backend ignores the filter and returns a full list.
 * - Does not require changes to the API module.
 */
type ItemWithSupplier = ItemRef & { supplierId?: string | null };

export default function Analytics(): JSX.Element {
  const { t } = useTranslation(['analytics', 'common']);
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();

  // ---------------------------------------------------------------------------
  // URL <-> State
  // ---------------------------------------------------------------------------

  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Hydrate filters from the URL once on mount.
   * - Defaults to last 180 days if range absent (BE requires start/end).
   * - `readParams` is robust to key variants and stray quotes.
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

  /** Keep URL in sync with canonical filter keys. */
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
  // Price Trend: **type-ahead** (global if no supplier, scoped if supplier set)
  // ---------------------------------------------------------------------------

  /** Controlled text the user types in the item search box. */
  const [itemQuery, setItemQuery] = React.useState<string>('');
  /** The selected item's id; the chart fetch depends on this. */
  const [selectedItemId, setSelectedItemId] = React.useState<string>('');
  /** Debounced input to prevent extra network calls as the user types. */
  const debouncedQuery = useDebounced(itemQuery, 250);

  /**
   * Search items:
   *  - If supplierId present → supplier-scoped endpoint
   *  - Else → global inventory search
   * **No request until the user types at least 1 character** (enabled gate).
   *
   * @enterprise
   * - This avoids loading 500+ items lists and guarantees relevance.
   * - If your BE ignores filters, we still apply client scoping below.
   */
  const itemSearchQ = useQuery<ItemRef[]>({
    queryKey: ['analytics', 'itemSearch', filters.supplierId ?? null, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      if (filters.supplierId) {
        return searchItemsForSupplier(filters.supplierId, debouncedQuery, 50);
      }
      return searchItemsGlobal(debouncedQuery, 50);
    },
    enabled: debouncedQuery.length >= 1, // user must type to trigger search
    staleTime: 30_000,
  });

  /** Reset the search box and selection whenever the supplier changes. */
  React.useEffect(() => {
    setItemQuery('');
    setSelectedItemId('');
  }, [filters.supplierId]);

  /**
   * Final options shown in the Price Trend type-ahead.
   * We *always* scope by supplierId when present, and we *always* filter
   * by the debounced query on the client, because the backend may ignore
   * these filters and return a wide list.
   *
   * @enterprise
   * - This guarantees correctness without BE changes.
   * - We slice to 50 to keep popover responsive.
   */
  const itemOptions: ItemWithSupplier[] = React.useMemo(() => {
    const raw = (itemSearchQ.data ?? []) as ItemWithSupplier[];
    const sid = filters.supplierId ?? '';
    const q = debouncedQuery.trim().toLowerCase();

    // BE may ignore supplierId; we enforce it here if present.
    const bySupplier = sid ? raw.filter((it) => (it.supplierId ?? '') === sid) : raw;

    // BE may ignore search; we enforce contains match here.
    const byQuery = q ? bySupplier.filter((it) => it.name.toLowerCase().includes(q)) : bySupplier;

    return byQuery.slice(0, 50);
  }, [itemSearchQ.data, filters.supplierId, debouncedQuery]);

  /**
   * Safeguard: if the current selection is no longer present in the options
   * (e.g., supplier changed, query changed, or BE returned different data),
   * clear the selection and the input to avoid stale state.
   */
  React.useEffect(() => {
    if (selectedItemId && !itemOptions.some((it) => it.id === selectedItemId)) {
      setSelectedItemId('');
      setItemQuery('');
    }
  }, [itemOptions, selectedItemId]);

  /** Price trend for the selected item (range-aware). */
  const priceQ = useQuery<PricePoint[]>({
    queryKey: ['analytics', 'priceTrend', selectedItemId, filters.from, filters.to],
    queryFn: () => getPriceTrend(selectedItemId, filters),
    // Important: do NOT reference itemOptions here (would create TDZ if placed after);
    // the safeguard effect above already ensures we only keep valid selections.
    enabled: !!selectedItemId,
  });

  // ---------------------------------------------------------------------------
  // Derived data (sorted so Recharts draw predictably)
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

      {/* Responsive cards grid */}
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
        {/* Price trend for selected item — type-ahead                           */}
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

              {/*
                Supplier-scoped item selector (type-ahead).
                @enterprise
                - Always a text-capable Autocomplete (not a plain <select>).
                - Global or supplier-scoped search is decided by presence of supplierId.
                - Server may return a wide list; we still narrow on the client (itemOptions).
              */}
              <Autocomplete<ItemWithSupplier, false, false, false>
                sx={{ minWidth: 320 }}
                options={itemOptions}
                getOptionLabel={(o: ItemWithSupplier) => o.name}
                loading={itemSearchQ.isLoading}
                value={itemOptions.find((it) => it.id === selectedItemId) || null}
                onChange={(_e: React.SyntheticEvent, val: ItemWithSupplier | null) =>
                  setSelectedItemId(val?.id ?? '')
                }
                // Controlled input text → this is what the user types into
                inputValue={itemQuery}
                onInputChange={(_e: React.SyntheticEvent, val: string) => setItemQuery(val)}
                // Do not re-filter client-side via MUI; we already do it in itemOptions
                filterOptions={(x) => x}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                forcePopupIcon={false}
                clearOnBlur={false}
                selectOnFocus
                handleHomeEndKeys
                renderInput={(params: AutocompleteRenderInputParams) => {
                  const typed = debouncedQuery.trim().length > 0;
                  const showNoMatches = !!filters.supplierId && typed && itemOptions.length === 0;
                  const showTypeHint = !!filters.supplierId && !typed;

                  return (
                    <TextField
                      {...params}
                      size="small"
                      label={t('analytics:item')}
                      placeholder={t('analytics:priceTrend.selectSupplierShort')}
                      helperText={
                        showNoMatches
                          ? t('analytics:priceTrend.noItemsForSupplier')
                          : showTypeHint
                            ? t('analytics:priceTrend.typeToSearch', 'Start typing to search…')
                            : ' '
                      }
                      FormHelperTextProps={{ sx: { minHeight: 20, mt: 0.5 } }}
                    />
                  );
                }}
                noOptionsText={
                  debouncedQuery
                    ? t('analytics:priceTrend.noItemsForSupplier')
                    : t('analytics:priceTrend.selectSupplierShort')
                }
              />
            </Stack>

            {/* Chart area */}
            {!selectedItemId || priceQ.isLoading ? (
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
              {t('analytics:cards.lowStock')}
            </Typography>

            {/* Fetch gated by a truthy supplierId */}
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
