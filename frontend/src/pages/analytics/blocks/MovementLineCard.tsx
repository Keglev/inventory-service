/**
 * @file MovementLineCard.tsx
 * @module pages/analytics/blocks/MovementLineCard
 *
 * @summary
 * Line chart version of monthly stock movement (A2) with two series:
 * Stock In vs Stock Out over months in the selected date range.
 *
 * @enterprise
 * - Reuses the same API as the bar version; purely a presentation swap.
 * - Supplier-aware via props; hook is unconditional and keyed by filters.
 */

import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { getMonthlyStockMovement, type MonthlyMovement } from '../../../api/analytics';

export type MovementLineCardProps = { from?: string; to?: string; supplierId?: string | null };

export default function MovementLineCard({ from, to, supplierId }: MovementLineCardProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();

  const q = useQuery<MonthlyMovement[]>({
    queryKey: ['analytics', 'movementLine', from ?? null, to ?? null, supplierId ?? null],
    queryFn: () => getMonthlyStockMovement({ from, to, supplierId: supplierId ?? undefined }),
    staleTime: 60_000,
  });

  const data = React.useMemo(
    () => [...(q.data ?? [])],
    [q.data]
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('analytics:cards.monthlyMovement')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : data.length === 0 ? (
          <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:cards.noData')}
          </Box>
        ) : (
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="stockIn"
                  name={t('analytics:cards.monthlyMovement') + ' • In'}
                  stroke={muiTheme.palette.success.main}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="stockOut"
                  name={t('analytics:cards.monthlyMovement') + ' • Out'}
                  stroke={muiTheme.palette.error.main}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
