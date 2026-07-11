/**
 * @file MonthlyMovementMini.tsx
 * @module pages/dashboard/blocks/MonthlyMovementMini
 *
 * @summary
 * Compact 90-day monthly stock-movement bar chart shown on the Dashboard.
 * Inbound (stockIn) and outbound (stockOut) bars share the analytics API
 * used by the full Analytics page.
 *
 * @enterprise
 * - Reuses getMonthlyStockMovement rather than a dashboard-specific endpoint
 *   to keep a single source of truth for stock-movement aggregation and to
 *   benefit from any caching the analytics layer applies.
 * - Bar colors are bound to MUI theme tokens (success.main / error.main) so
 *   palette changes (light/dark mode, brand recolor) propagate without
 *   touching this component.
 * - Window is a rolling 90 days computed at render time; not memoized
 *   because the cost is trivial and the values are stable per day.
 *
 * @i18n
 * Uses 'common' namespace. Key: dashboard.kpi.movementTitle.
 *
 * Keys: dashboard.kpi.movementTitle, dashboard.kpi.stockIn/stockOut,
 * units.pieces (all in the 'common' namespace).
 */
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getMonthlyStockMovement } from '../../../api/analytics/stock';
import { getTodayIso, getDaysAgoIso, formatNumber } from '../../../utils/formatters';
import { useSettings } from '../../../hooks/useSettings';

/**
 * Monthly stock movement chart component for dashboard KPI section.
 * Shows a 90-day rolling window of stock in/out movement aggregated by month.
 * @returns Memoized React component with dual-bar chart or skeleton loading state
 */
export default function MonthlyMovementMini() {
  const { t } = useTranslation('common');
  const { userPreferences } = useSettings();
  // Calculate 90-day window (from: 90 days ago, to: today)
  const from = getDaysAgoIso(90);
  const to = getTodayIso();
  const muiTheme = useMuiTheme();

  // Fetch monthly aggregated stock movement data
  const q = useQuery({
    queryKey: ['dashboard', 'movementMini', from, to],
    queryFn: () => getMonthlyStockMovement({ from, to }),
  });
  return (
    <Card>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        {/* Card title */}
        <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
          {t('dashboard.kpi.movementTitle')}
        </Typography>

        {/* Show skeleton while data is loading, otherwise render bar chart */}
        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : (
          <Box sx={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={q.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)}
                />
                <Tooltip
                  formatter={(value: number | string) =>
                    typeof value === 'number'
                      ? `${formatNumber(value, userPreferences.numberFormat, 0)} ${t('units.pieces')}`
                      : value
                  }
                />
                <Legend />
                {/* Green bars: inbound stock movements */}
                <Bar
                  dataKey="stockIn"
                  name={t('dashboard.kpi.stockIn')}
                  fill={muiTheme.palette.success.main}
                />
                {/* Red bars: outbound stock movements */}
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