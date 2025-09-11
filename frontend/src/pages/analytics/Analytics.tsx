/**
 * @file Analytics.tsx
 * @description
 * Starter analytics dashboard with three charts:
 *  1) Stock value over time (Line)
 *  2) Monthly stock movement (Bar: inbound vs outbound)
 *  3) Price trend for a selected item (Line)
 *
 * Charts remain stable even if endpoints return [].
 */
import * as React from 'react';
import { Box, Typography, Card, CardContent, Stack, MenuItem, TextField, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import {
  getStockValueOverTime, getMonthlyStockMovement, getTopItems, getPriceTrend,
} from '../../api/analytics';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useTranslation } from 'react-i18next';

export default function Analytics() {
  const { t } = useTranslation<'common'>('common');

  const stockValueQ = useQuery({ queryKey: ['analytics','stockValue'], queryFn: getStockValueOverTime });
  const movementQ   = useQuery({ queryKey: ['analytics','movement'],   queryFn: getMonthlyStockMovement });
  const itemsQ      = useQuery({ queryKey: ['analytics','items'],      queryFn: getTopItems });

  const [itemId, setItemId] = React.useState<string | null>(null);
  const priceQ = useQuery({
    queryKey: ['analytics','priceTrend', itemId],
    queryFn: () => getPriceTrend(itemId || ''),
    enabled: !!itemId,
  });

  React.useEffect(() => {
    if (!itemId && itemsQ.data && itemsQ.data.length > 0) {
      setItemId(itemsQ.data[0].id);
    }
  }, [itemsQ.data, itemId]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>{t('analytics.title')}</Typography>

      <Stack spacing={2}>
        {/* Stock value over time */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t('analytics.cards.stockValue')}
            </Typography>
            {stockValueQ.isLoading ? (
              <Skeleton variant="rounded" height={220} />
            ) : (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockValueQ.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Monthly movements */}
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
                  <BarChart data={movementQ.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="inbound" />
                    <Bar dataKey="outbound" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Price trend for selected item */}
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Typography variant="subtitle1" sx={{ flex: 1 }}>
                {t('analytics.cards.priceTrend')}
              </Typography>
              <TextField
                size="small"
                select
                label={t('analytics.item')}
                value={itemId ?? ''}
                onChange={(e) => setItemId(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                {(itemsQ.data ?? []).map((it) => (
                  <MenuItem key={it.id} value={it.id}>{it.name}</MenuItem>
                ))}
              </TextField>
            </Stack>
            {priceQ.isFetching ? (
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
