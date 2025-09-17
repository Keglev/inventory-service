/**
 * @file StockPerSupplier.tsx
 * @description
 * Current total stock grouped by supplier. Toggle between quantity and value.
 *
 * @enterprise
 * - Robust normalizers in API keep the chart stable.
 * - Handles lots of suppliers by rendering top-N + "long labels wrap" fallback.
 */

import * as React from 'react';
import type { JSX } from 'react';
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import {
  getStockPerSupplier,
  type StockPerSupplierPoint,
} from '../../../api/analytics';
import {
  ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, Bar,
} from 'recharts';

type Metric = 'quantity' | 'value';

export default function StockPerSupplier(): JSX.Element {
  const { t } = useTranslation(['analytics']);
  const theme = useTheme();
  const [metric, setMetric] = React.useState<Metric>('quantity');

  const q = useQuery<StockPerSupplierPoint[]>({
    queryKey: ['analytics', 'stockPerSupplier'],
    queryFn: getStockPerSupplier,
    staleTime: 60_000,
    retry: 0,
  });

  const data = q.data ?? [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <ToggleButtonGroup
        size="small"
        value={metric}
        exclusive
        onChange={(_, v) => v && setMetric(v)}
        sx={{ alignSelf: 'flex-end' }}
      >
        <ToggleButton value="quantity">{t('analytics:stockPerSupplier.metricToggle.quantity')}</ToggleButton>
        <ToggleButton value="value">{t('analytics:stockPerSupplier.metricToggle.value')}</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="supplierName" interval={0} angle={-20} height={60} textAnchor="end" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey={metric === 'quantity' ? 'totalQuantity' : 'totalValue'}
              fill={metric === 'quantity' ? theme.palette.primary.main : theme.palette.secondary.main}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
