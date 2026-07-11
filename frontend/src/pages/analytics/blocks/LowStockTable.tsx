/**
 * @file LowStockTable.tsx
 * @module pages/analytics/blocks/LowStockTable
 *
 * @summary
 * Low-stock table for a selected supplier. Shows item name, current
 * quantity, minimum threshold, computed deficit, and a status chip
 * (OK / Warning / Critical) -- ordered by most severe deficit first.
 *
 * @enterprise
 * - BUSINESS RULE: the Critical chip fires when a row's deficit reaches
 *   LOW_STOCK_CRITICAL_THRESHOLD (config/inventoryPolicy). Deficit
 *   computation, ordering, and the visible cap live in useLowStockRows;
 *   this file owns only the chip mapping and table markup.
 * - The optional `limit` prop caps the visible rows (default 12; pass
 *   0 to show all). A "Showing n of m" footer appears whenever the
 *   list is capped, so the cap is never silent.
 * - Sticky header plus horizontal overflow handle long item names and
 *   narrow viewports without column collapse.
 */

import { useCallback, type JSX } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLowStockRows } from '../hooks/useLowStockRows';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { LowStockTableRow } from './LowStockTableRow';

/**
 * Props accepted by {@link LowStockTable}.
 * @public
 */
export type LowStockTableProps = {
  /** Required supplier id whose items should be evaluated for low stock. */
  supplierId: string;
  /** Optional ISO date (YYYY-MM-DD) for lower bound. */
  from?: string;
  /** Optional ISO date (YYYY-MM-DD) for upper bound. */
  to?: string;
  /** Show at most N most severe rows (by deficit). `0` = show all. @defaultValue 12 */
  limit?: number;
};


/**
 * Displays items at or below minimum quantity for a given supplier,
 * most severe deficit first. Data and derivation come from
 * {@link useLowStockRows}; this component maps rows to table markup
 * and severity chips.
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
  const formatQty = useCallback(
    (value: number | undefined | null): string => {
      if (typeof value !== 'number' || Number.isNaN(value)) return formatNumber(0, userPreferences.numberFormat, 0);
      return formatNumber(value, userPreferences.numberFormat, 0);
    },
    [userPreferences.numberFormat]
  );

  const { enabled, isLoading, isError, visible, total } = useLowStockRows(supplierId, from, to, limit);

  // Conditional UI states

  if (!enabled) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        {t('analytics:selectSupplier')}
      </Box>
    );
  }

  if (isLoading) {
    return <Skeleton variant="rounded" height={220} />;
  }

  if (isError) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        {t('common:error')}
      </Box>
    );
  }

  if (visible.length === 0) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        {t('analytics:lowStock.noneForSupplier')}
      </Box>
    );
  }

  return (
    <TableContainer 
      component={Paper} 
      variant="outlined" 
      sx={{ 
          maxHeight: 360,
          overflowX: 'auto', // Allow Horizontal scroll instead of clipping
          pr: 1,            // tiny right gutter so chips and tooltips do not get cut off
        }}
    >
      <Table 
        size="small" 
        stickyHeader
        sx={{
        minWidth: 640,     // avoids cramped columns on small breakpoints
        tableLayout: 'fixed', // predictable column widths; text can ellipsis
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '40%' }}>
              {t('analytics:lowStock.columns.item')}
            </TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>
              {t('analytics:lowStock.columns.quantity')}
            </TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>
              {t('analytics:lowStock.columns.minimum')}
            </TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>
              {t('analytics:lowStock.columns.deficit')}
            </TableCell>
            <TableCell align="left" sx={{ width: '15%', whiteSpace: 'nowrap' }}>
              {t('analytics:lowStock.columns.status')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visible.map((r) => (
            <LowStockTableRow key={r.itemName} row={r} formatQty={formatQty} />
          ))}
        </TableBody>
      </Table>
      {limit > 0 && total > limit && (
        <Box sx={{ p: 1.5, color: 'text.secondary' }}>
          <Typography variant="caption">
            {t('analytics:lowStock.shownNOfM', {
              n: visible.length,
              m: total,
            })}
          </Typography>
        </Box>
      )}
    </TableContainer>
  );
}
