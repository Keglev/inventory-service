/**
 * @file ReasonBreakdownMini.tsx
 * @module pages/dashboard/blocks/ReasonBreakdownMini
 *
 * @summary
 * Compact grouped bar of stock movement per change-reason (increase vs
 * decrease) for the dashboard. Unfiltered/global; reuses the analytics reason
 * label lookup so the 11 StockChangeReason values stay in sync.
 *
 * @enterprise
 * - A reason may carry both an increase and a decrease at once (e.g. manual
 *   corrections); rows with no movement in either direction are dropped.
 * - Reason labels resolve via the analytics namespace; card chrome uses common.
 *
 * @i18n common: dashboard.reasons.{title,empty,increase,decrease}; analytics:
 *   reasons.* and units.pieces (reused).
 */
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getReasonBreakdown, type ReasonBreakdownRow } from '../../../api/analytics/reasonBreakdown';
import { reasonLabel } from '../../analytics/sections/reasonLabels';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';

export default function ReasonBreakdownMini() {
  const { t } = useTranslation('common');
  const { t: tAnalytics } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const q = useQuery<ReasonBreakdownRow[]>({
    queryKey: ['dashboard', 'reasonBreakdownMini'],
    queryFn: () => getReasonBreakdown(),
    staleTime: 60_000,
  });

  const data = React.useMemo(
    () =>
      (q.data ?? [])
        .filter((r) => r.increase > 0 || r.decrease > 0)
        .map((r) => ({ label: reasonLabel(tAnalytics, r.reason), increase: r.increase, decrease: r.decrease })),
    [q.data, tAnalytics]
  );

  return (
    <Card>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
          {t('dashboard.reasons.title')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : data.length === 0 ? (
          <Box sx={{ height: 240, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('dashboard.reasons.empty')}
          </Box>
        ) : (
          <Box sx={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)} />
                <Tooltip
                  formatter={(value: number | string) =>
                    typeof value === 'number'
                      ? `${formatNumber(value, userPreferences.numberFormat, 0)} ${tAnalytics('analytics:units.pieces')}`
                      : value
                  }
                />
                <Legend />
                <Bar dataKey="increase" name={t('dashboard.reasons.increase')} fill={muiTheme.palette.success.main} />
                <Bar dataKey="decrease" name={t('dashboard.reasons.decrease')} fill={muiTheme.palette.error.main} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
