/**
 * @file ReasonBreakdownChartCard.tsx
 * @module pages/analytics/sections/ReasonBreakdownChartCard
 *
 * @summary
 * Presentational bar chart for ONE movement direction (increases or decreases)
 * of the per-reason breakdown.
 *
 * @enterprise
 * The parent supplies already translated labels and pre-filtered values, so this
 * card stays dumb and is rendered twice side by side (increases left, decreases
 * right).
 */
import * as React from 'react';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import ChartCard from '../components/ChartCard';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';

export type ReasonBreakdownDatum = {
  /** Translated reason label (X axis). */
  label: string;
  /** Aggregated quantity for this direction. */
  value: number;
};

export type ReasonBreakdownChartCardProps = {
  /** Card heading (already translated). */
  title: string;
  /** Tooltip name of the series (already translated); without it Recharts shows the dataKey "value". */
  seriesName: string;
  /** Chart rows; empty renders the shared no-data state. */
  data: ReasonBreakdownDatum[];
  /** Bar fill color (theme palette value from the parent). */
  color: string;
  /** Query loading flag from the parent (one query feeds both cards). */
  loading: boolean;
};

export default function ReasonBreakdownChartCard({ title, seriesName, data, color, loading }: ReasonBreakdownChartCardProps) {
  const { t } = useTranslation(['analytics']);
  const { userPreferences } = useSettings();
  const muiTheme = useMuiTheme();

  const formatValue = React.useCallback(
    (value: number | string) =>
      typeof value === 'number' ? formatNumber(value, userPreferences.numberFormat, 0) : String(value),
    [userPreferences.numberFormat]
  );

  const formatTooltipValue = React.useCallback(
    (value: unknown) =>
      typeof value === 'number'
        ? `${formatNumber(value, userPreferences.numberFormat, 0)} ${t('analytics:units.pieces')}`
        : String(value ?? ''),
    [userPreferences.numberFormat, t]
  );

  return (
    <ChartCard
      title={title}
      loading={loading}
      empty={data.length === 0}
      emptyText={t('analytics:cards.noData')}
      testId="reason-breakdown-card"
    >
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" interval={0} angle={-25} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tickFormatter={formatValue} />
        <Tooltip {...chartTooltipProps(muiTheme)} formatter={formatTooltipValue} />
        <Bar dataKey="value" name={seriesName} fill={color} isAnimationActive={false} />
      </BarChart>
    </ChartCard>
  );
}
