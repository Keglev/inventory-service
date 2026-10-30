/**
 * @file EmployeesActivityChart.tsx
 * @module pages/analytics/sections/EmployeesActivityChart
 * @summary Employee activity line chart card with a granularity toggle.
 * @enterprise
 * Extracted from EmployeesSection so the section composes two cards
 * instead of inlining the chart. Owns the presentation of the pivoted
 * per-employee series and the recharts wiring; colours, the time axis and every
 * formatter come from useEmployeeChartFormatting.
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
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { chartLegendProps } from '../../../utils/chartLegend';
import { timeXAxisProps } from '../../../utils/timeAxis';
import { useEmployeeChartFormatting } from './useEmployeeChartFormatting';

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
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { rows, timeAxis, seriesColors, formatCount, formatPeriod, formatPeriodSpan, formatTooltipCount } =
    useEmployeeChartFormatting({ granularity, chartData, employees, from, to });

  return (
    <Card data-testid="employee-activity-card">
      <CardContent>
        {/* Title and toggle share one row from sm up. At 390 px the German toggle alone is
            279 px and the row ran 31 px past the card edge, cut "MONATLICH" (S2-14). */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
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
