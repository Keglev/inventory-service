/**
 * @file Analytics.tsx
 * @description Starter analytics dashboard with three charts:
 *  1) Stock value over time (Line)
 *  2) Monthly stock movement (Bar: stockIn vs stockOut)
 *  3) Price trend for a selected item (Line)
 *
 * Charts render safely even if endpoints return empty arrays.
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
import {useTheme as useMuiTheme } from '@mui/material/styles';
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

/**
 * Analytics page component.
 * @returns JSX element rendering analytics cards and charts.
 */
export default function Analytics(): JSX.Element {
  const { t } = useTranslation<'common'>('common');
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();

  /** Stock value over time (last 6 months by default). */
  const stockValueQ = useQuery({
    queryKey: ['analytics', 'stockValue'],
    queryFn: getStockValueOverTime,
    retry: 0, // fail fast if endpoint is down
    staleTime: 60_000 // 1 minute
  });

  /** Monthly stock movement (stockIn vs stockOut). */
  const movementQ = useQuery({
    queryKey: ['analytics', 'movement'],
    queryFn: getMonthlyStockMovement,
  });

  /** Item list for driving the price trend selector. */
  const itemsQ = useQuery<ItemRef[]>({
    queryKey: ['analytics', 'items'],
    queryFn: getTopItems,
  });

  /** Currently selected item for price trend. */
  const [selectedItemId, setSelectedItemId] = React.useState<string>('');

  /** Price trend for the selected item (enabled only when an itemId exists). */
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

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header + "Back to Dashboard" */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">{t('analytics.title')}</Typography>
        <Button variant="text" onClick={() => navigate('/dashboard')}>
          {t('actions.backToDashboard')}
        </Button>
      </Stack>

      <Stack spacing={2}>
        {/* Stock value over time */}
        {/* Using `unknown` as data type and normalizing fields in the API function,}
        {/* to handle possible variants from different backends. */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('analytics.cards.stockValue')}
            </Typography>
            {stockValueQ.isLoading ? (
              <Skeleton variant="rounded" height={220} />
            ) : stockValueQ.isError ? (
              <Box sx={{ height: 260, display: 'grid', placeItems:'center', color: 'text.secondary' }}>
                {t('common:noData', 'No data available')}
              </Box>
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockValueQ.data ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalValue" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Monthly movements */}
        {/** Using `unknown` as data type and normalizing fields in the API function,}
        {/* to handle possible variants from different backends. */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('analytics.cards.monthlyMovement')}
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

        {/* Price trend for selected item */}
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle1">{t('analytics.cards.priceTrend')}</Typography>

              <TextField
                select
                size="small"
                label={t('analytics.item')}
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                sx={{ minWidth: 260 }}
                disabled={itemsQ.isLoading || itemsQ.isError}
              >
                {(!itemsQ.data || itemsQ.data.length === 0) ? (
                  <MenuItem disabled value="">
                    {t('common:noItems', 'No items available')}
                  </MenuItem>
                ) : (
                  itemsQ.data.map((it) => (
                    <MenuItem key={it.id} value={it.id}>{it.name}</MenuItem>
                ))
                )}
              </TextField>
            </Stack>

            {!selectedItemId ? (
              <Skeleton variant="rounded" height={220} />
            ) : priceQ.isLoading ? (
              <Skeleton variant="rounded" height={220} />
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceQ.data ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="price" />
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

