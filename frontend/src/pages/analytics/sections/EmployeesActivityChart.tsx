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
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { EmployeeGranularity } from '../../../api/analytics/employees';
import type { EmployeesChartRow } from './useEmployeesSectionData';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { monthLabel, monthSpanLabel } from '../../../utils/monthLabels';
import { parseDayOrWeekKey } from '../../../utils/periodKeys';
import { colorsByKey } from '../../../utils/entityColors';
import { seriesPalette } from '../../../theme/tokens';

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

  // Daily and weekly keys become dates in the user's format (a week by its
  // Monday, as on the stock activity card); monthly keys ("YYYY-MM") get month
  // labels, and the tooltip names the covered days of a partial month.
  const formatPeriod = React.useCallback(
    (value: unknown) => {
      const bucket = parseDayOrWeekKey(String(value));
      return bucket ? formatDate(bucket.start, userPreferences.dateFormat) : monthLabel(String(value), i18n.language);
    },
    [i18n.language, userPreferences.dateFormat]
  );
  const formatPeriodSpan = React.useCallback(
    (value: unknown) => {
      const bucket = parseDayOrWeekKey(String(value));
      if (!bucket) {
        return monthSpanLabel(String(value), { from, to, lang: i18n.language, dateFormat: userPreferences.dateFormat });
      }
      const date = formatDate(bucket.start, userPreferences.dateFormat);
      return bucket.kind === 'week' ? t('analytics:updates.weekOf', { date }) : date;
    },
    [from, to, i18n.language, userPreferences.dateFormat, t]
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
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} tickFormatter={formatPeriod} />
                <YAxis allowDecimals={false} tickFormatter={formatCount} />
                {/* Same order as the legend: people, alphabetical by name. */}
                <Tooltip
                  {...chartTooltipProps(muiTheme)}
                  itemSorter="name"
                  formatter={formatTooltipCount}
                  labelFormatter={formatPeriodSpan}
                />
                {/* Series are people: alphabetical by name reads the same in every language. */}
                <Legend itemSorter="value" />
                {employees.map((emp, idx) => (
                  <Line
                    key={emp.createdBy}
                    // Counts per period: straight segments, no invented curve between periods.
                    type="linear"
                    dataKey={(row: EmployeesChartRow) => (row[emp.createdBy] as number | undefined) ?? 0}
                    name={emp.displayName}
                    stroke={seriesColors[idx]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
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
