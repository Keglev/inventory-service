/**
 * @file PriceTrendChart.tsx
 * @module pages/analytics/blocks/PriceTrendChart
 *
 * @summary
 * Step chart of one item's price over the selected range, on a time axis.
 *
 * @enterprise
 * Split from PriceTrendCard, which keeps the item picker and the query; this
 * component owns how a price series is drawn. A price holds until it changes, so
 * the line is a step (stepAfter) and the carried last price gets no dot. The X
 * axis is a time scale over the selected range, so the gap between two changes
 * shows how long a price held.
 */
import * as React from 'react';
import { Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { dayTimeAxis } from '../../../utils/timeAxis';
import { priceValueAxis, type ChartPricePoint } from './priceSeries';

export type PriceTrendChartProps = {
  /** Non-empty series from buildPriceSeries. */
  series: ChartPricePoint[];
  /** Selected range (ISO dates); the X axis spans it. */
  from?: string;
  to?: string;
};

export default function PriceTrendChart({ series, from, to }: PriceTrendChartProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();
  const formatDateLabel = React.useCallback(
    (value: string | number) => {
      // Numbers are epoch ms from the time axis; strings are ISO dates.
      const formatted = formatDate(typeof value === 'number' ? new Date(value) : String(value), userPreferences.dateFormat);
      return formatted || String(value);
    },
    [userPreferences.dateFormat]
  );
  const timeAxis = React.useMemo(() => dayTimeAxis(series.map((p) => p.t), from, to), [series, from, to]);
  const valueAxis = React.useMemo(() => priceValueAxis(series), [series]);
  const color = muiTheme.palette.primary.main;

  return (
    <Box sx={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={timeAxis.domain}
            ticks={timeAxis.ticks}
            tickFormatter={formatDateLabel}
          />
          <YAxis
            domain={valueAxis.domain}
            ticks={valueAxis.ticks}
            tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 2)}
          />
          <Tooltip
            {...chartTooltipProps(muiTheme)}
            labelFormatter={(value) => formatDateLabel(value as string | number)}
            formatter={(value) =>
              typeof value === 'number' ? `${formatNumber(value, userPreferences.numberFormat, 2)} €` : value
            }
          />
          <Line
            // A price holds until the next change: steps, not a curve between changes.
            type="stepAfter"
            dataKey="price"
            name={t('analytics:cards.priceSeries')}
            stroke={color}
            strokeWidth={2}
            dot={(props: { cx?: number; cy?: number; index?: number; payload?: ChartPricePoint }) =>
              props.payload?.carried ? (
                <g key={props.index} />
              ) : (
                <circle key={props.index} cx={props.cx} cy={props.cy} r={2} fill={color} />
              )
            }
            activeDot={{ r: 4 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
