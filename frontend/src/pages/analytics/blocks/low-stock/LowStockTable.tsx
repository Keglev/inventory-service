/**
 * @file LowStockTable.tsx
 * @module pages/analytics/blocks/low-stock
 *
 * @description
 * Low stock items table for a selected supplier.
 * Shows item name, current qty, minimum threshold, deficit, and status.
 * Query is disabled when no supplierId is provided (React Query `enabled` flag).
 *
 * @remarks
 * - Data source: `GET /api/analytics/low-stock-items?supplierId=...&from=...&to=...`
 * - Compounds deficit = max(0, minimum - current) and sorts by severity
 * - Shows max N items; displays count if limited
 * - Responsive with sticky header and horizontal scroll on small screens
 *
 * @i18n
 * Uses 'analytics' namespace for all translation keys
 */

import type { JSX } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Table,
  TableContainer,
  Paper,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getLowStockItems, type LowStockRow } from '../../../../api/analytics';
import { useSettings } from '../../../../hooks/useSettings';
import { LowStockTableHeader } from './LowStockTableHeader';
import { LowStockTableRows } from './LowStockTableRows';
import type { LowStockTableProps, LowStockRowWithDeficit } from './LowStockTable.types';
import { narrowParams } from './LowStockTable.types';

/**
 * Low stock table component
 * Displays items at/below minimum quantity for a supplier with deficit metrics
 *
 * @example
 * ```tsx
 * <LowStockTable supplierId="sup-123" from="2025-06-01" to="2025-09-15" limit={12} />
 * ```
 */
export default function LowStockTable(props: LowStockTableProps): JSX.Element {
  const { supplierId, from, to, limit = 12 } = props;
  const { t } = useTranslation(['analytics', 'common']);
  const { userPreferences } = useSettings();

  // Gate query by supplierId (enabled flag prevents hook calls)
  const enabled = Boolean(supplierId);

  // Fetch low stock items with supplier and date filtering
  const q = useQuery<LowStockRow[], Error>({
    queryKey: ['analytics', 'lowStock', supplierId, from ?? null, to ?? null],
    queryFn: () => getLowStockItems(supplierId, narrowParams({ from, to })),
    enabled,
    staleTime: 60_000,
  });

  // Supplier not selected: show hint
  if (!enabled) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        {t('analytics:selectSupplier', 'Select a supplier to see low stock')}
      </Box>
    );
  }

  // Loading: show skeleton
  if (q.isLoading) {
    return <Skeleton variant="rounded" height={220} />;
  }

  // Error: show message
  if (q.isError) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        {t('common:error', 'Error')}
      </Box>
    );
  }

  // Compute deficits and sort by severity (highest first)
  const rows: LowStockRowWithDeficit[] = (q.data ?? [])
    .map((r) => ({
      ...r,
      deficit: Math.max(0, (r.minimumQuantity ?? 0) - (r.quantity ?? 0)),
    }))
    // Keep only truly low stock items (deficit > 0 or quantity <= minimum)
    .filter((r) => r.deficit > 0 || (r.quantity ?? 0) <= (r.minimumQuantity ?? 0))
    .sort((a, b) => b.deficit - a.deficit);

  // Apply limit if specified
  const visible = limit > 0 ? rows.slice(0, limit) : rows;

  // No low stock items: show message
  if (visible.length === 0) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        {t('analytics:lowStock.noneForSupplier', 'No items below minimum for this supplier')}
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{
        maxHeight: 360,
        overflowX: 'auto',
        pr: 1,
      }}
    >
      <Table
        size="small"
        stickyHeader
        sx={{
          minWidth: 640,
          tableLayout: 'fixed',
        }}
      >
        <LowStockTableHeader />
        <LowStockTableRows rows={visible} numberFormat={userPreferences.numberFormat} />
      </Table>

      {/* Show count if results are limited */}
      {limit > 0 && rows.length > limit && (
        <Box sx={{ p: 1.5, color: 'text.secondary' }}>
          <Typography variant="caption">
            {t('analytics:lowStock.shownNOfM', 'Showing {{n}} of {{m}} items', {
              n: visible.length,
              m: rows.length,
            })}
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
}
