/**
 * @file Analytics.tsx
 * @description Starter analytics dashboard with three charts:
 *  1) Stock value over time (Line)
 *  2) Monthly stock movement (Bar: stockIn vs stockOut)
 *  3) Price trend for a selected item (Line)
 *
 * Implementation notes:
 * - Charts render safely even if endpoints return empty arrays.
 * - The stock-value series is explicitly sorted ascending by `date`.
 * - Lines use explicit theme colors so they never inherit a transparent stroke.
 *
 * i18n:
 * - Labels now come from the dedicated "analytics" namespace.
 * - Shared UI actions (e.g., "Back to Dashboard") remain under "common".
 */

import * as React from 'react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router-dom';
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
  type PricePoint,
  type ItemRef,
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

export default function Analytics(): JSX.Element {
  // Load both namespaces: "analytics" for local labels, "common" for shared actions.
  const { t } = useTranslation(['analytics', 'common']);
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  // Stock value over time (last 6 months by default).
  // Fail fast on errors and keep data fresh for 1 minute.
  const stockValueQ = useQuery({
    queryKey: ['analytics', 'stockValue'],
    queryFn: getStockValueOverTime,
    retry: 0,
    staleTime: 60_000,
  });

  // Monthly stock movement (stockIn vs stockOut).
  const movementQ = useQuery({
    queryKey: ['analytics', 'movement'],
    queryFn: getMonthlyStockMovement,
  });

  // Item list (for the price-trend dropdown).
  const itemsQ = useQuery<ItemRef[]>({
    queryKey: ['analytics', 'items'],
    queryFn: getTopItems,
  });

  // Currently selected item for price trend.
  const [selectedItemId, setSelectedItemId] = React.useState<string>('');

  // Price trend for the selected item (only when an item is selected).
  const priceQ = useQuery<PricePoint[]>({
    queryKey: ['analytics', 'priceTrend', selectedItemId],
    queryFn: () => getPriceTrend(selectedItemId),
    enabled: !!selectedItemId,
  });

  // Pick the first item automatically once items are loaded.
  React.useEffect(() => {
    if (!selectedItemId && itemsQ.data && itemsQ.data.length > 0) {
      setSelectedItemId(itemsQ.data[0].id);
    }
  }, [itemsQ.data, selectedItemId]);

  // ---------------------------------------------------------------------------
  // Derived data (sorted arrays so Recharts draws predictably)
  // ---------------------------------------------------------------------------

  // Sort stock-value series left→right by date. Using nullish coalescing to stay defensive.
  const stockValueData = React.useMemo(
    () => [...(stockValueQ.data ?? [])].sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? '')),
    [stockValueQ.data]
  );

  // Sort price trend by date as well (in case backend returns gaps/out-of-order rows).
  const priceTrendData = React.useMemo(
    () => [...(priceQ.data ?? [])].sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? '')),
    [priceQ.data]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header + "Back to Dashboard" */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">{t('analytics:title')}</Typography>
        <Button variant="text" onClick={() => navigate('/dashboard')}>
          {t('common:actions.backToDashboard')}
        </Button>
      </Stack>

      <Stack spacing={2}>
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
                    {/* Explicit stroke to avoid theme-side invisibility */}
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

            {/* Skeleton while loading; otherwise either show "no data" or the chart */}
            {(!selectedItemId || priceQ.isLoading) ? (
              <Skeleton variant="rounded" height={220} />
            ) : priceQ.isError ? (
              <Box sx={{ height: 260, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                {t('analytics:cards.noData')}
              </Box>
            ) : priceTrendData.length === 0 ? (
              <Box sx={{ height: 260, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                {t('analytics:cards.noData')}
              </Box>
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={priceTrendData}
                    margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                    key={selectedItemId} // force a fresh line when item changes
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
      </Stack>
    </Box>
  );
}
