/**
 * @file EmployeesActivityChart.tsx
 * @module pages/analytics/sections/EmployeesActivityChart
 * @summary Employee activity line chart card with a granularity toggle.
 * @enterprise
 * Extracted from EmployeesSection so the section composes two cards
 * instead of inlining the chart. Owns the presentation of the pivoted
 * per-employee series: a fixed colour per employee (keyed by email), count formatting
 * bound to the user's number preference, and the recharts wiring.
 * Emails contain dots and Recharts resolves string dataKeys as nested
 * paths, so each series uses a FUNCTION accessor (locked lesson) --
 * do not "simplify" to string keys. Data, granularity state, and the
 * pivot itself stay in useEmployeesSectionData; this card is render-only.
 */
import * as React from 'react';
import { Box, Card, CardContent, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Dot } from 'recharts';
import type { DotItemDotProps } from 'recharts/types/util/types';
import type { EmployeeGranularity } from '../../../api/analytics/employees';
import type { EmployeesChartRow } from './useEmployeesSectionData';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { chartLegendProps } from '../../../utils/chartLegend';
import { monthLabel, monthSpanLabel } from '../../../utils/monthLabels';
import { dayTimeAxis, timeXAxisProps } from '../../../utils/timeAxis';
import { employeeTimeRows, monthKey, monthTicks, utcDay } from './employeeTimeSeries';
import { colorsByKey } from '../../../utils/entityColors';
import { seriesPalette } from '../../../theme/tokens';

/**
 * Daily buckets fill a long range with zeros; a dot on each would bead the base
 * line, so a day shows a dot only when someone changed something.
 */
function nonZeroDot(props: DotItemDotProps) {
  const { cx, cy, stroke, fill, strokeWidth, index, value } = props;
  return value ? (
    <Dot key={index} cx={cx} cy={cy} r={3} stroke={stroke} fill={fill} strokeWidth={strokeWidth} />
  ) : (
    <g key={index} />
  );
}

/** One chart series descriptor (an employee). @public */
export type EmployeeSeries = { createdBy: string; displayName: string };

/** Props accepted by {@link EmployeesActivityChart}. @public */
export type EmployeesActivityChartProps = {
  /** Selected aggregation bucket. */
  granularity: EmployeeGranularity;
  /** Bucket change (toggle). */
  onGranularityChange: (next: EmployeeGranularity) => void;
  /** Pivoted rows: one object per period with per-employee counts. */
  chartData: EmployeesChartRow[];
  /** Series descriptors in stable order (keys into the pivoted rows). */
  employees: EmployeeSeries[];
  /** True while the aggregation query loads. */
  loading: boolean;
  /** Selected range (ISO dates); a monthly tooltip names the covered days of a partial month. */
  from?: string;
  to?: string;
};

/**
 * Renders the activity chart card.
 *
 * @param props - {@link EmployeesActivityChartProps}
 * @returns The card element.
 * @public
 */
export function EmployeesActivityChart({
  granularity,
  onGranularityChange,
  chartData,
  employees,
  loading,
  from,
  to,
}: EmployeesActivityChartProps): React.JSX.Element {
  const { t, i18n } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const seriesColors = React.useMemo(() => {
    const byEmail = colorsByKey(
      employees.map((e) => e.createdBy),
      seriesPalette[muiTheme.palette.mode === 'dark' ? 'dark' : 'light'],
    );
    return employees.map((e) => byEmail[e.createdBy]);
  }, [employees, muiTheme.palette.mode]);

  const formatCount = React.useCallback(
    (value: number | string) =>
      typeof value === 'number' ? formatNumber(value, userPreferences.numberFormat, 0) : String(value),
    [userPreferences.numberFormat]
  );

  // Buckets sit on a time axis at their first day; quiet periods are filled with
  // zeros (employeeTimeSeries). Days and weeks are labelled by date in the
  // user's format (a week by its Monday, as on the stock activity card), months
  // by name; the tooltip names the covered days of a partial month.
  const rows = React.useMemo(
    () => employeeTimeRows(chartData, granularity, from, to),
    [chartData, granularity, from, to]
  );
  const timeAxis = React.useMemo(() => {
    const times = rows.map((r) => r.t);
    if (times.length === 0) return null;
    if (granularity !== 'monthly') return dayTimeAxis(times);
    return { domain: [times[0], times[times.length - 1]] as [number, number], ticks: monthTicks(times) };
  }, [rows, granularity]);
  const formatPeriod = React.useCallback(
    (value: unknown) =>
      granularity === 'monthly'
        ? monthLabel(monthKey(Number(value)), i18n.language)
        : formatDate(utcDay(Number(value)), userPreferences.dateFormat),
    [granularity, i18n.language, userPreferences.dateFormat]
  );
  const formatPeriodSpan = React.useCallback(
    (value: unknown) => {
      const start = Number(value);
      if (granularity === 'monthly') {
        return monthSpanLabel(monthKey(start), { from, to, lang: i18n.language, dateFormat: userPreferences.dateFormat });
      }
      const date = formatDate(utcDay(start), userPreferences.dateFormat);
      return granularity === 'weekly' ? t('analytics:updates.weekOf', { date }) : date;
    },
    [granularity, from, to, i18n.language, userPreferences.dateFormat, t]
  );
  const formatTooltipCount = React.useCallback(
    (value: unknown) =>
      typeof value === 'number'
        ? `${formatNumber(value, userPreferences.numberFormat, 0)} ${t('analytics:units.changes', { count: value })}`
        : String(value ?? ''),
    [userPreferences.numberFormat, t]
  );

  return (
    <Card data-testid="employee-activity-card">
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle1">{t('analytics:employees.chartTitle')}</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={granularity}
            onChange={(_e, next: EmployeeGranularity | null) => {
              if (next) onGranularityChange(next);
            }}
          >
            <ToggleButton value="daily">{t('analytics:employees.granularity.daily')}</ToggleButton>
            <ToggleButton value="weekly">{t('analytics:employees.granularity.weekly')}</ToggleButton>
            <ToggleButton value="monthly">{t('analytics:employees.granularity.monthly')}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {loading ? (
          <Skeleton variant="rounded" height={240} />
        ) : chartData.length === 0 ? (
          <Box sx={{ height: 240, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:employees.empty')}
          </Box>
        ) : (
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...timeXAxisProps(timeAxis, formatPeriod)} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tickFormatter={formatCount} />
                {/* Same order as the legend: people, alphabetical by name. */}
                <Tooltip
                  {...chartTooltipProps(muiTheme)}
                  itemSorter="name"
                  formatter={formatTooltipCount}
                  labelFormatter={formatPeriodSpan}
                />
                {/* Series are people: alphabetical by name reads the same in every language. */}
                <Legend {...chartLegendProps(muiTheme)} itemSorter="value" />
                {employees.map((emp, idx) => (
                  <Line
                    key={emp.createdBy}
                    // Counts per period: straight segments, no invented curve between periods.
                    type="linear"
                    dataKey={(row: EmployeesChartRow) => (row[emp.createdBy] as number | undefined) ?? 0}
                    name={emp.displayName}
                    stroke={seriesColors[idx]}
                    strokeWidth={2}
                    dot={granularity === 'daily' ? nonZeroDot : { r: 3 }}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
