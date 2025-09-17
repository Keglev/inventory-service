/**
 * @file LowStockTable.tsx
 * @description
 * Low-stock items (quantity < minimum) for the selected supplier.
 *
 * @enterprise
 * - Only queries the backend when a supplier is selected (avoids 400/403).
 * - Graceful states: loading, empty, "supplier required", and error.
 */

import type { JSX } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody, Skeleton, Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getLowStockItems, type LowStockRow } from '../../../api/analytics';

export type LowStockTableProps = {
  supplierId?: string;
};

export default function LowStockTable({ supplierId }: LowStockTableProps): JSX.Element {
  const { t } = useTranslation(['analytics']);

  // Only enable the query when supplierId exists (API requires supplierId).
  const q = useQuery<LowStockRow[]>({
    queryKey: ['analytics', 'lowStockItems', supplierId],
    queryFn: () => getLowStockItems(supplierId!),
    enabled: !!supplierId,
    retry: 0,
  });

  if (!supplierId) {
    return (
      <Alert severity="info" variant="outlined">
        {t('analytics:lowStock.empty')}
      </Alert>
    );
  }

  if (q.isLoading) {
    return <Skeleton variant="rounded" height={160} />;
  }

  if (q.isError) {
    return (
      <Alert severity="error" variant="outlined">
        {t('analytics:state.error')}
      </Alert>
    );
  }

  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <Box sx={{ py: 2, color: 'text.secondary' }}>
        {t('analytics:lowStock.empty')}
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="low-stock">
        <TableHead>
          <TableRow>
            <TableCell>{t('analytics:lowStock.columns.item')}</TableCell>
            <TableCell>{t('analytics:lowStock.columns.quantity')}</TableCell>
            <TableCell>{t('analytics:lowStock.columns.minQty')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={`${r.itemName}-${idx}`}>
              <TableCell>{r.itemName}</TableCell>
              <TableCell>{r.quantity}</TableCell>
              <TableCell>{r.minimumQuantity}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
