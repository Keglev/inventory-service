/**
 * @file PriceChart.tsx
 * @description
 * Price trend line chart component.
 * Renders recharts LineChart with date/price formatting.
 */

import { Box, Skeleton } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import type { PricePoint } from '../../../../api/analytics';
import type { DateFormat } from '../../../../context/settings/SettingsContext.types';
import { formatDate, formatNumber } from '../../../../utils/formatters';

/**
 * Props for PriceChart
 */
export interface PriceChartProps {
  /** Price data points to render */
  data: PricePoint[];
  /** Whether chart is loading */
  isLoading: boolean;
  /** Date format preference (DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY) */
  dateFormat: DateFormat;
  /** Number format preference (DE, EN_US, etc) */
  numberFormat: 'DE' | 'EN_US';
}

/**
 * Price trend line chart
 * Displays price movement over time with formatted axes
 */
export function PriceChart({
  data,
  isLoading,
  dateFormat,
  numberFormat,
}: PriceChartProps) {
  const muiTheme = useMuiTheme();

  // Format date labels for x-axis
  const formatDateLabel = (value: string | number) => {
    const str = String(value);
    // dateFormat is already typed as DateFormat from props
    const formatted = formatDate(str, dateFormat);
    return formatted || str;
  };

  // Sort data by date for deterministic rendering
  const sortedData = useMemo(
    () => [...data].sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? '')),
    [data]
  );

  if (isLoading) {
    return <Skeleton variant="rounded" height={220} />;
  }

  if (sortedData.length === 0) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        No price data available
      </Box>
    );
  }

  return (
    <Box sx={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={formatDateLabel} />
          <YAxis
            domain={['auto', 'auto']}
            tickFormatter={(value) => formatNumber(Number(value), numberFormat, 2)}
          />
          <Tooltip
            labelFormatter={(value) => formatDateLabel(value as string)}
            formatter={(value: number | string) =>
              typeof value === 'number'
                ? formatNumber(value, numberFormat, 2)
                : value
            }
          />
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
  );
}
