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
import { formatNumber, getDaysAgoIso, getTodayIso } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { chartAxisProps } from '../../../utils/chartAxis';
import { chartLegendProps, legendOrder } from '../../../utils/chartLegend';
import { CHART_MARGIN } from './chartMargin';

/** Stock in before stock out in every language (see utils/chartLegend). */
const LEGEND_ORDER = legendOrder(['increase', 'decrease']);

export default function ReasonBreakdownMini() {
  const { t } = useTranslation('common');
  const { t: tAnalytics } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  // Same window as the movement chart beside it (Carlos, fork 5 option A). Without
  // dates the server answered with its default of 30 days, which the title never said.
  const from = getDaysAgoIso(90);
  const to = getTodayIso();
  const q = useQuery<ReasonBreakdownRow[]>({
    queryKey: ['dashboard', 'reasonBreakdownMini', from, to],
    queryFn: () => getReasonBreakdown({ from, to }),
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
          <Box sx={{ height: 200, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('dashboard.reasons.empty')}
          </Box>
        ) : (
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={data} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...chartAxisProps(muiTheme, { fontSize: 11 })} dataKey="label" interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis {...chartAxisProps(muiTheme)} tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)} />
                <Tooltip
                  {...chartTooltipProps(muiTheme)}
                  itemSorter={LEGEND_ORDER}
                  formatter={(value) =>
                    typeof value === 'number'
                      ? `${formatNumber(value, userPreferences.numberFormat, 0)} ${tAnalytics('analytics:units.pieces')}`
                      : value
                  }
                />
                <Legend {...chartLegendProps(muiTheme)} itemSorter={LEGEND_ORDER} />
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
