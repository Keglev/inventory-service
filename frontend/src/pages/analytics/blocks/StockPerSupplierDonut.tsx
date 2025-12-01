/**
 * @file StockPerSupplierDonut.tsx
 * @module pages/analytics/blocks/StockPerSupplierDonut
 *
 * @summary
 * Donut (pie) view of stock share per supplier (quantity-based).
 * Uses /api/analytics/stock-per-supplier which returns totals by supplier.
 *
 * @enterprise
 * - Purely presentational alternative to the bar version.
 * - Gracefully handles empty datasets and long supplier names (legend).
 */

import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';
import { getStockPerSupplier, type StockPerSupplierPoint } from '../../../api/analytics';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';

export default function StockPerSupplierDonut() {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const q = useQuery<StockPerSupplierPoint[]>({
    queryKey: ['analytics', 'stockPerSupplierDonut'],
    queryFn: getStockPerSupplier,
    staleTime: 60_000,
  });

  const data = React.useMemo(
    () => (q.data ?? []).map(d => ({ name: d.supplierName, value: d.totalQuantity })),
    [q.data]
  );

  const colors = [
    muiTheme.palette.primary.main,
    muiTheme.palette.success.main,
    muiTheme.palette.info.main,
    muiTheme.palette.warning.main,
    muiTheme.palette.error.main,
    muiTheme.palette.secondary.main,
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {t('analytics:stockPerSupplier.title')}
        </Typography>

        {q.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : data.length === 0 ? (
          <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:stockPerSupplier.empty', 'No supplier data for the current filters.')}
          </Box>
        ) : (
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={1}
                  isAnimationActive={false}
                >
                  {data.map((_, i) => (
                    <Cell key={`seg-${i}`} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string) =>
                    typeof value === 'number'
                      ? formatNumber(value, userPreferences.numberFormat, 0)
                      : value
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
