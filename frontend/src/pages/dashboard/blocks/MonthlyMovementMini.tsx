/**
 * @file MonthlyMovementMini.tsx
 * @module pages/dashboard/blocks/MonthlyMovementMini
 *
 * @summary
 * Compact monthly stock movement chart for the Dashboard.
 * Displays inbound and outbound stock movements over the last 90 days.
 * Reuses the same API as the full Analytics page.
 *
 * @responsibilities
 * - Fetch monthly aggregated stock movement data (90-day window)
 * - Display dual-bar chart with color-coded inbound (success) and outbound (error) bars
 * - Show loading skeleton while data is being fetched
 * - Apply theme colors for visual consistency
 *
 * @usage
 * <MonthlyMovementMini />
 *
 * @i18n
 * Uses translation key: dashboard.kpi.movementTitle
 */
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getMonthlyStockMovement } from '../../../api/analytics';
import { getTodayIso, getDaysAgoIso } from '../../../utils/formatters';

/**
 * Monthly stock movement chart component for dashboard KPI section.
 * Shows a 90-day rolling window of stock in/out movement aggregated by month.
 * @returns Memoized React component with dual-bar chart or skeleton loading state
 */
export default function MonthlyMovementMini() {
  const { t } = useTranslation('common');
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
          {t('dashboard.kpi.movementTitle', 'Stock movement (90d)')}
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
                <YAxis />
                <Tooltip />
                <Legend />
                {/* Green bars: inbound stock movements */}
                <Bar dataKey="stockIn" fill={muiTheme.palette.success.main} />
                {/* Red bars: outbound stock movements */}
                <Bar dataKey="stockOut" fill={muiTheme.palette.error.main} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}