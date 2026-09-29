/**
 * @file StockValuePerSupplierPie.tsx
 * @module pages/analytics/blocks/StockValuePerSupplierPie
 *
 * @summary
 * Pie of the stock value held per supplier: the top four by name and one grey
 * slice for all others. Shown on the dashboard and the analytics page.
 *
 * @enterprise
 * - Value in euros, not pieces: pieces are not comparable across items, the
 *   capital held per supplier is. Values come from
 *   /api/analytics/stock-per-supplier (quantity times current unit price).
 * - At most five slices and five legend lines, so the card keeps its height
 *   however many suppliers exist; the grouping rule is supplierValueSlices.
 * - The tooltip carries the value and the share, so the legend stays names only.
 */

import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Legend, Cell } from 'recharts';
import { getStockPerSupplier } from '../../../api/analytics/stock';
import type { StockPerSupplierPoint } from '../../../api/analytics/types';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { chartTooltipProps } from '../../../utils/chartTooltip';
import { supplierValueSlices } from './supplierValueSlices';

export default function StockValuePerSupplierPie() {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();

  const q = useQuery<StockPerSupplierPoint[]>({
    queryKey: ['analytics', 'stockValuePerSupplier'],
    queryFn: getStockPerSupplier,
    staleTime: 60_000,
  });

  const data = React.useMemo(
    () =>
      supplierValueSlices(q.data ?? []).map((s) => ({
        name: s.kind === 'others' ? t('analytics:stockPerSupplier.others', { count: s.others }) : s.name,
        value: s.value,
        others: s.kind === 'others',
      })),
    [q.data, t]
  );
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Named slices take fixed colours in rank order; the grouped slice is always grey.
  const colors = [
    muiTheme.palette.primary.main,
    muiTheme.palette.success.main,
    muiTheme.palette.info.main,
    muiTheme.palette.warning.main,
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
            {t('analytics:stockPerSupplier.empty')}
          </Box>
        ) : (
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="80%"
                  isAnimationActive={false}
                >
                  {data.map((d, i) => (
                    <Cell key={`slice-${i}`} fill={d.others ? muiTheme.palette.grey[500] : colors[i]} />
                  ))}
                </Pie>
                <Tooltip
                  {...chartTooltipProps(muiTheme)}
                  formatter={(value) =>
                    typeof value === 'number'
                      ? `${formatNumber(value, userPreferences.numberFormat, 2)} € · ${formatNumber(
                          (100 * value) / total,
                          userPreferences.numberFormat,
                          1
                        )} %`
                      : value
                  }
                />
                {/* Recharts sorts legend items alphabetically by default; keep the
                    slices' rank order so "all others" stays last. */}
                <Legend itemSorter={(item) => data.findIndex((d) => d.name === item.value)} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
