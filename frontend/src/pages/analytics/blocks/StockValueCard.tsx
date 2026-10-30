/**
 * @file StockValueCard.tsx
 * @module pages/analytics/blocks/StockValueCard
 *
 * @summary
 * Card that renders the stock value over time (A1) as a step line on a time axis.
 *
 * @enterprise
 * - The value holds until the next stock movement, so the line is a step
 *   (stepAfter) without point dots.
 * - The backend sends change points: the first day with history, each day the
 *   value changes, and the range end. The X axis is a time scale over the
 *   selected range, so the gaps between points keep their real width, and the
 *   last value is carried to the range end (utils/stepSeries) should a response
 *   stop short of it. A series that starts after the range start leaves the
 *   days before it empty instead of drawing 0 EUR.
 * - `staleTime: 60_000` keeps the chart stable during quick navigation
 *   between analytics sections without flicker.
 * - `retry: 0` because an empty result is a valid state for the cold-start
 *   case (no items yet); there is no point repeating the request.
 */
import * as React from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import ChartCard from '../components/ChartCard';
import { getStockValueOverTime, type StockValuePoint } from '../../../api/analytics/stock';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { chartAxisProps } from '../../../utils/chartAxis';
import { toStepSeries } from '../../../utils/stepSeries';
import { dayTimeAxis, timeXAxisProps } from '../../../utils/timeAxis';
import { useDayFormatter } from '../../../hooks/useDayFormatter';

export type StockValueCardProps = { from?: string; to?: string; supplierId?: string | null };

export default function StockValueCard({ from, to, supplierId }: StockValueCardProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const q = useQuery<StockValuePoint[]>({
    queryKey: ['analytics', 'stockValue', from, to, supplierId ?? null],
    queryFn: () => getStockValueOverTime({ from, to, supplierId: supplierId ?? undefined }),
    staleTime: 60_000,
    retry: 0,
  });

  const series = React.useMemo(() => toStepSeries(q.data, to), [q.data, to]);
  const timeAxis = React.useMemo(
    () => (series.length ? dayTimeAxis(series.map((p) => p.t), from, to) : null),
    [series, from, to]
  );
  // A flat series on an 'auto' axis zooms to a sliver around its value (248–252 for
  // 250 EUR); anchoring the axis at zero shows it as the level it is.
  const flat = series.length > 0 && series.every((p) => p.totalValue === series[0].totalValue);
  const formatDay = useDayFormatter();

  return (
    <ChartCard
      title={t('analytics:cards.stockValue')}
      loading={q.isLoading}
      empty={!timeAxis}
      emptyText={t('analytics:cards.noData')}
      emptyHeight={260}
    >
      <LineChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis {...chartAxisProps(muiTheme)} {...timeXAxisProps(timeAxis, formatDay)} />
        <YAxis
          {...chartAxisProps(muiTheme)}
          width="auto"
          domain={flat ? [0, 'auto'] : ['auto', 'auto']}
          tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)}
        />
        <Tooltip
          {...chartTooltipProps(muiTheme)}
          labelFormatter={formatDay}
          formatter={(value) =>
            typeof value === 'number' ? `${formatNumber(value, userPreferences.numberFormat, 2)} €` : value
          }
        />
        <Line
          type="stepAfter"
          dataKey="totalValue"
          name={t('analytics:cards.stockValueSeries')}
          stroke={muiTheme.palette.primary.main}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ChartCard>
  );
}
