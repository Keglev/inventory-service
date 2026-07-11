/**
 * @file EmployeesActivityChart.tsx
 * @module pages/analytics/sections/EmployeesActivityChart
 * @summary Employee activity line chart card with a granularity toggle.
 * @enterprise
 * Extracted from EmployeesSection so the section composes two cards
 * instead of inlining the chart. Owns the presentation of the pivoted
 * per-employee series: palette cycling per employee, count formatting
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
import { formatNumber } from '../../../utils/formatters';

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
}: EmployeesActivityChartProps): React.JSX.Element {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const seriesColors = React.useMemo(() => {
    const palette = [
      muiTheme.palette.primary.main,
      muiTheme.palette.success.main,
      muiTheme.palette.warning.main,
      muiTheme.palette.error.main,
      muiTheme.palette.info.main,
      muiTheme.palette.secondary.main,
    ];
    return employees.map((_, idx) => palette[idx % palette.length]);
  }, [employees, muiTheme]);

  const formatCount = React.useCallback(
    (value: number | string) =>
      typeof value === 'number' ? formatNumber(value, userPreferences.numberFormat, 0) : String(value),
    [userPreferences.numberFormat]
  );

  const formatTooltipCount = React.useCallback(
    (value: number | string) =>
      typeof value === 'number'
        ? `${formatNumber(value, userPreferences.numberFormat, 0)} ${t('analytics:units.changes')}`
        : String(value),
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
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tickFormatter={formatCount} />
                <Tooltip formatter={formatTooltipCount} />
                <Legend />
                {employees.map((emp, idx) => (
                  <Line
                    key={emp.createdBy}
                    type="monotone"
                    dataKey={(row: EmployeesChartRow) => (row[emp.createdBy] as number | undefined) ?? 0}
                    name={emp.displayName}
                    stroke={seriesColors[idx]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
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
