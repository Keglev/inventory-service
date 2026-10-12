/**
 * @file RecentStockActivityCard.tsx
 * @module pages/analytics/blocks/RecentStockActivityCard
 *
 * @summary
 * Stock changes per day and kind over the selected range: stock in as bars
 * above zero, stock out below, on a time axis.
 *
 * @enterprise
 * - Reads the full list from `getStockUpdates`; the movement drilldown
 *   pages the same data through `getStockUpdatesPage`. Daily aggregation
 *   needs every row of the window, and the list endpoint has no row limit.
 * - Grouping and signs live in stockActivitySeries.
 * - Bars stack by sign (stackOffset="sign"), so in and out never add up.
 * - The X axis is a time scale over the selected range: days without changes
 *   keep their width instead of disappearing between two bars. Long ranges
 *   group by week (see stockActivitySeries) and the tooltip says "Woche ab".
 * - Each kind keeps its colour whatever else the supplier has. Colours were
 *   assigned by position among the kinds present, so "Verkauf" changed colour
 *   between suppliers, and two near-identical blues sat side by side.
 */
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { purple } from '@mui/material/colors';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ReferenceLine } from 'recharts';
import { getStockUpdates, type StockUpdateRow } from '../../../api/analytics/updates';
import { dayTimeAxis, timeXAxisProps } from '../../../utils/timeAxis';
import { useDayFormatter } from '../../../hooks/useDayFormatter';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { legendOrder } from '../../../utils/chartLegend';
import { activityBucket, buildActivitySeries, ACTIVITY_LEGEND_ORDER, type ActivityKey } from './stockActivitySeries';

export type RecentStockActivityCardProps = { from?: string; to?: string; supplierId?: string | null };

/** Legend and tooltip follow ACTIVITY_LEGEND_ORDER, not the alphabet of the translated labels. */
const LEGEND_ORDER = legendOrder(ACTIVITY_LEGEND_ORDER);

const DAY_MS = 86_400_000;

export default function RecentStockActivityCard({ from, to, supplierId }: RecentStockActivityCardProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const q = useQuery<StockUpdateRow[]>({
    queryKey: ['analytics', 'stockUpdates', from, to, supplierId ?? null],
    queryFn: () => getStockUpdates({ from, to, supplierId: supplierId ?? undefined }),
  });

  const bucket = activityBucket(from, to);
  const bucketMs = bucket === 'week' ? 7 * DAY_MS : DAY_MS;
  const { days, keys } = React.useMemo(() => buildActivitySeries(q.data, bucket), [q.data, bucket]);
  const timeAxis = React.useMemo(() => dayTimeAxis(days.map((d) => d.t), from, to), [days, from, to]);

  const colors = React.useMemo((): Record<ActivityKey, string> => {
    const { palette } = muiTheme;
    return {
      returnIn: palette.secondary.main,
      initialStock: palette.success.main,
      adjustment: palette.primary.main,
      sale: palette.error.main,
      returnOut: palette.mode === 'dark' ? purple[300] : purple[700],
      writeOff: palette.warning.main,
      other: palette.grey[500],
    };
  }, [muiTheme]);

  const formatDay = useDayFormatter();
  const formatBucket = React.useCallback(
    (value: unknown) => (bucket === 'week' ? t('analytics:updates.weekOf', { date: formatDay(value) }) : formatDay(value)),
    [bucket, formatDay, t]
  );
  const formatPieces = React.useCallback(
    (value: unknown) => `${formatNumber(Number(value), userPreferences.numberFormat, 0)} ${t('analytics:units.pieces')}`,
    [userPreferences.numberFormat, t]
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('analytics:updates.title')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={260} />
        ) : days.length === 0 ? (
          <Box sx={{ color: 'text.secondary' }}>{t('analytics:updates.empty')}</Box>
        ) : (
          <Box sx={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={days} stackOffset="sign" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  {...timeXAxisProps(timeAxis, formatDay)}
                  // Half a bucket on each side, so a bar at either end is not cut in half.
                  domain={[timeAxis.domain[0] - bucketMs / 2, timeAxis.domain[1] + bucketMs / 2]}
                />
                <YAxis width="auto" tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)} />
                <ReferenceLine y={0} stroke={muiTheme.palette.text.secondary} />
                <Tooltip
                  {...chartTooltipProps(muiTheme)}
                  itemSorter={LEGEND_ORDER}
                  formatter={formatPieces}
                  labelFormatter={formatBucket}
                />
                <Legend itemSorter={LEGEND_ORDER} />
                {keys.map((key) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="activity"
                    name={t(`analytics:updates.labels.${key}`)}
                    fill={colors[key]}
                    maxBarSize={14}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
