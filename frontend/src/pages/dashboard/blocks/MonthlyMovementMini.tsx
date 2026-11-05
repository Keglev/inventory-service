/**
 * @file MonthlyMovementMini.tsx
 * @module pages/dashboard/blocks/MonthlyMovementMini
 *
 * @summary
 * Compact 90-day monthly stock-movement bar chart shown on the Dashboard.
 *
 * @enterprise
 * - Reuses getMonthlyStockMovement, the analytics API of the full Analytics page,
 *   rather than a dashboard-specific endpoint, to keep a single source of truth for
 *   stock-movement aggregation (its query key is its own, so no cache is shared).
 * - Bar colors are bound to MUI theme tokens (success.main / error.main) so
 *   palette changes (light/dark mode, brand recolor) propagate without
 *   touching this component.
 * - Window is a rolling 90 days computed at render time; not memoized
 *   because the cost is trivial and the values are stable per day.
 *
 * @i18n
 * Uses 'common' namespace. Keys: dashboard.kpi.movementTitle,
 * dashboard.kpi.stockIn/stockOut, units.pieces.
 */
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getMonthlyStockMovement } from '../../../api/analytics/stock';
import { getTodayIso, getDaysAgoIso, formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { chartAxisProps } from '../../../utils/chartAxis';
import { chartLegendProps } from '../../../utils/chartLegend';
import { MOVEMENT_ORDER, movementTooltip } from '../../../utils/movementTooltip';
import { CHART_MARGIN } from './chartMargin';
import { monthLabel } from '../../../utils/monthLabels';
import { useSettings } from '../../../hooks/useSettings';

/**
 * Monthly stock movement chart component for dashboard KPI section.
 * Shows a 90-day rolling window of stock in/out movement aggregated by month.
 * @returns Dual-bar chart, or a skeleton while loading
 */
export default function MonthlyMovementMini() {
  const { t, i18n } = useTranslation('common');
  const { userPreferences } = useSettings();
  const from = getDaysAgoIso(90);
  const to = getTodayIso();
  const muiTheme = useMuiTheme();

  const q = useQuery({
    queryKey: ['dashboard', 'movementMini', from, to],
    queryFn: () => getMonthlyStockMovement({ from, to }),
  });
  return (
    <Card>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
          {t('dashboard.kpi.movementTitle')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : (
          <Box sx={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={q.data ?? []} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...chartAxisProps(muiTheme)} dataKey="month" tickFormatter={(value) => monthLabel(String(value), i18n.language)} />
                <YAxis
                  {...chartAxisProps(muiTheme)}
                  tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)}
                />
                <Tooltip
                  {...chartTooltipProps(muiTheme)}
                  itemSorter={MOVEMENT_ORDER}
                  {...movementTooltip({
                    from,
                    to,
                    lang: i18n.language,
                    dateFormat: userPreferences.dateFormat,
                    numberFormat: userPreferences.numberFormat,
                    unit: t('units.pieces'),
                  })}
                />
                <Legend {...chartLegendProps(muiTheme)} itemSorter={MOVEMENT_ORDER} />
                <Bar
                  dataKey="stockIn"
                  name={t('dashboard.kpi.stockIn')}
                  fill={muiTheme.palette.success.main}
                />
                <Bar
                  dataKey="stockOut"
                  name={t('dashboard.kpi.stockOut')}
                  fill={muiTheme.palette.error.main}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}