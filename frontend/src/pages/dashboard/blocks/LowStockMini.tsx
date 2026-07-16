/**
 * @file LowStockMini.tsx
 * @module pages/dashboard/blocks/LowStockMini
 *
 * @summary
 * Global low-stock watchlist for the dashboard: horizontal bars comparing each
 * item's current quantity against its minimum threshold. Data comes from the
 * dashboard summary endpoint (all-suppliers low-stock), not a supplier-scoped
 * query, so it works without a supplier selection.
 *
 * @enterprise
 * - Bar colors bind to MUI theme tokens (error/warning) so palette changes
 *   propagate without edits here.
 * - Empty and loading states are handled locally; the fetcher never throws.
 *
 * @i18n common namespace: dashboard.lowStockChart.{title,empty,quantity,minimum}.
 */
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { getDashboardLowStock } from '../../../api/analytics/dashboardSummary';
import type { LowStockRow } from '../../../api/analytics/types';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';

export default function LowStockMini() {
  const { t } = useTranslation('common');
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const q = useQuery<LowStockRow[]>({
    queryKey: ['dashboard', 'lowStockMini'],
    queryFn: getDashboardLowStock,
    staleTime: 60_000,
  });

  const data = q.data ?? [];

  return (
    <Card>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 0.75 }}>
          {t('dashboard.lowStockChart.title')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : data.length === 0 ? (
          <Box sx={{ height: 240, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('dashboard.lowStockChart.empty')}
          </Box>
        ) : (
          <Box sx={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)}
                />
                <YAxis type="category" dataKey="itemName" width={110} />
                <Tooltip
                  formatter={(value: number | string) =>
                    typeof value === 'number'
                      ? formatNumber(value, userPreferences.numberFormat, 0)
                      : value
                  }
                />
                <Legend />
                <Bar dataKey="quantity" name={t('dashboard.lowStockChart.quantity')} fill={muiTheme.palette.error.main} />
                <Bar dataKey="minimumQuantity" name={t('dashboard.lowStockChart.minimum')} fill={muiTheme.palette.warning.main} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
