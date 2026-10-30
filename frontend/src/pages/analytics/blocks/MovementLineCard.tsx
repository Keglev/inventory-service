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
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import ChartCard from '../components/ChartCard';
import { getMonthlyStockMovement } from '../../../api/analytics/stock';
import type { MonthlyMovement } from '../../../api/analytics/types';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { monthLabel } from '../../../utils/monthLabels';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { chartAxisProps } from '../../../utils/chartAxis';
import { chartLegendProps } from '../../../utils/chartLegend';
import { MOVEMENT_ORDER, movementTooltip } from '../../../utils/movementTooltip';


export type MovementLineCardProps = { from?: string; to?: string; supplierId?: string | null };

export default function MovementLineCard({ from, to, supplierId }: MovementLineCardProps) {
  const { t, i18n } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

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
    <ChartCard
      title={t('analytics:cards.monthlyMovement')}
      loading={q.isLoading}
      empty={data.length === 0}
      emptyText={t('analytics:cards.noData')}
    >
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis {...chartAxisProps(muiTheme)} dataKey="month" tickFormatter={(value) => monthLabel(String(value), i18n.language)} />
        <YAxis {...chartAxisProps(muiTheme)} tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)} />
        <Tooltip
          {...chartTooltipProps(muiTheme)}
          itemSorter={MOVEMENT_ORDER}
          {...movementTooltip({
            from,
            to,
            lang: i18n.language,
            dateFormat: userPreferences.dateFormat,
            numberFormat: userPreferences.numberFormat,
            unit: t('analytics:units.pieces'),
          })}
        />
        <Legend {...chartLegendProps(muiTheme)} itemSorter={MOVEMENT_ORDER} />
        <Line
          // Monthly totals: straight segments between the months, no invented curve.
          type="linear"
          dataKey="stockIn"
          name={t('analytics:cards.stockIn')}
          stroke={muiTheme.palette.success.main}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
        <Line
          // Monthly totals: straight segments between the months, no invented curve.
          type="linear"
          dataKey="stockOut"
          name={t('analytics:cards.stockOut')}
          stroke={muiTheme.palette.error.main}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartCard>
  );
}
