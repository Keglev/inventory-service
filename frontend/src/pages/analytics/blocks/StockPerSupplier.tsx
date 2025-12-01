/**
 * @file StockPerSupplier.tsx
 * @description
 * Current total stock grouped by supplier (QUANTITY ONLY).
 *
 * @enterprise
 * - Mirrors backend StockPerSupplierDTO (supplierName, totalQuantity).
 * - Keeps the component minimal until we add "value" semantics.
 */

import type { JSX } from 'react';
import { Box } from '@mui/material';
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
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';

export default function StockPerSupplier(): JSX.Element {
  const { t } = useTranslation(['analytics']);
  const theme = useTheme();
  const { userPreferences } = useSettings();

  const q = useQuery<StockPerSupplierPoint[]>({
    queryKey: ['analytics', 'stockPerSupplier'],
    queryFn: getStockPerSupplier,
    staleTime: 60_000,
    retry: 0,
  });

  const data = q.data ?? [];

  if (data.length === 0) {
    return (
      <Box sx={{ py: 2, color: 'text.secondary' }}>
        {t('analytics:stockPerSupplier.empty')}
      </Box>
    );
  }

  return (
    <Box sx={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="supplierName" interval={0} angle={-20} height={60} textAnchor="end" />
          <YAxis tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 0)} />
          <Tooltip
            formatter={(value: number | string) =>
              typeof value === 'number'
                ? formatNumber(value, userPreferences.numberFormat, 0)
                : value
            }
          />
          <Bar dataKey="totalQuantity" fill={theme.palette.primary.main} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
