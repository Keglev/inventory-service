/**
 * @file useEmployeeChartFormatting.ts
 * @module pages/analytics/sections/useEmployeeChartFormatting
 * @summary Series colours, time rows, time axis and the formatters of the employee activity chart.
 * @enterprise
 * Split out of EmployeesActivityChart (2026-10-29): what the chart shows and how its values
 * read are decided here, the card only lays the chart out. Every formatter follows the user's
 * number and date preferences and the active language, so the axis, the tooltip and the legend
 * agree. Colours are keyed by email, never by position, so a person keeps one colour whatever
 * else is on the chart.
 */
import * as React from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import type { EmployeeGranularity } from '../../../api/analytics/employees';
import type { EmployeesChartRow } from './useEmployeesSectionData';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { monthLabel, monthSpanLabel } from '../../../utils/monthLabels';
import { dayTimeAxis } from '../../../utils/timeAxis';
import { employeeTimeRows, monthKey, monthTicks, utcDay } from './employeeTimeSeries';
import { colorsByKey } from '../../../utils/entityColors';
import { seriesPalette } from '../../../theme/tokens';

/** Inputs of {@link useEmployeeChartFormatting}. @public */
export type EmployeeChartFormattingInput = {
  /** Selected aggregation bucket. */
  granularity: EmployeeGranularity;
  /** Pivoted rows: one object per period with per-employee counts. */
  chartData: EmployeesChartRow[];
  /** Series keys (emails) in stable order. */
  employees: { createdBy: string }[];
  /** Selected range (ISO dates). */
  from?: string;
  to?: string;
};

/**
 * Derives what the employee activity chart draws and how it labels it.
 *
 * @param input - {@link EmployeeChartFormattingInput}
 * @returns Rows on the time axis, the axis, one colour per employee and the formatters.
 * @public
 */
export function useEmployeeChartFormatting({ granularity, chartData, employees, from, to }: EmployeeChartFormattingInput) {
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

  return { rows, timeAxis, seriesColors, formatCount, formatPeriod, formatPeriodSpan, formatTooltipCount };
}
