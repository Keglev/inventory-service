/**
 * @file ReasonBreakdownChartCard.tsx
 * @module pages/analytics/sections/ReasonBreakdownChartCard
 *
 * @summary
 * Presentational bar chart for ONE movement direction (increases or
 * decreases) of the per-reason breakdown. The parent supplies already
 * translated labels and pre-filtered values, so this card stays dumb and is
 * rendered twice side by side (increases left, decreases right).
 */
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';

export type ReasonBreakdownDatum = {
  /** Translated reason label (X axis). */
  label: string;
  /** Aggregated quantity for this direction. */
  value: number;
};

export type ReasonBreakdownChartCardProps = {
  /** Card heading (already translated). */
  title: string;
  /** Chart rows; empty renders the shared no-data state. */
  data: ReasonBreakdownDatum[];
  /** Bar fill color (theme palette value from the parent). */
  color: string;
  /** Query loading flag from the parent (one query feeds both cards). */
  loading: boolean;
};

export default function ReasonBreakdownChartCard({ title, data, color, loading }: ReasonBreakdownChartCardProps) {
  const { t } = useTranslation(['analytics']);
  const { userPreferences } = useSettings();

  const formatValue = React.useCallback(
    (value: number | string) =>
      typeof value === 'number' ? formatNumber(value, userPreferences.numberFormat, 0) : String(value),
    [userPreferences.numberFormat]
  );

  return (
    <Card data-testid="reason-breakdown-card">
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {title}
        </Typography>

        {loading ? (
          <Skeleton variant="rounded" height={220} />
        ) : data.length === 0 ? (
          <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:cards.noData')}
          </Box>
        ) : (
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" interval={0} angle={-25} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tickFormatter={formatValue} />
                <Tooltip formatter={formatValue} />
                <Bar dataKey="value" fill={color} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
