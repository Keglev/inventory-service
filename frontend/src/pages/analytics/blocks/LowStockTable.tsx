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
 * - BUSINESS RULE: an item is considered "low stock" when its deficit
 *   (`minimumQuantity - quantity`) reaches LOW_STOCK_CRITICAL_THRESHOLD
 *   (config/inventoryPolicy). This drives the Critical chip.
 * - The deficit is computed client-side from `quantity` and
 *   `minimumQuantity`; the backend does NOT pre-compute it. Rows are
 *   ordered by deficit descending so the most urgent items are at top.
 * - The hook is unconditional and gated via `enabled = !!supplierId`
 *   to comply with the Rules of Hooks. The query key includes
 *   supplier + date window so the cache stays correct across changes.
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
  Chip,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getLowStockItems } from '../../../api/analytics/lowStock';
import type { LowStockRow } from '../../../api/analytics/types';
import type { AnalyticsParams } from '../../../api/analytics/validation';
import { useSettings } from '../../../hooks/useSettings';
import { formatNumber } from '../../../utils/formatters';
import { LOW_STOCK_CRITICAL_THRESHOLD } from '../../../config/inventoryPolicy';

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

/** Narrow filter params to only allowed keys for the low-stock endpoint. @internal */
function narrowParams(p: Pick<AnalyticsParams, 'from' | 'to'>): AnalyticsParams {
  const out: AnalyticsParams = {};
  if (p.from) out.from = p.from;
  if (p.to) out.to = p.to;
  return out;
}

/**
 * LowStockTable
 *
 * Displays items at or below minimum quantity for a given supplier. The
 * query is always declared at the top level and conditionally enabled via
 * React Query's `enabled` flag, which complies with the Rules of Hooks.
 *
 * @example
 * ```tsx
 * <LowStockTable supplierId="sup-123" from="2025-06-01" to="2025-09-15" limit={12} />
 * ```
 */
export default function LowStockTable(props: LowStockTableProps): JSX.Element {
  const { supplierId, from, to, limit = 12 } = props;
  const { t } = useTranslation(['analytics', 'common']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();
  const formatQty = useCallback(
    (value: number | undefined | null): string => {
      if (typeof value !== 'number' || Number.isNaN(value)) return formatNumber(0, userPreferences.numberFormat, 0);
      return formatNumber(value, userPreferences.numberFormat, 0);
    },
    [userPreferences.numberFormat]
  );

  // Data fetching (Hooks MUST be unconditioned; gate with `enabled`)
  const enabled = Boolean(supplierId);

  /**
   * React Query:
   * - Keyed by endpoint + supplierId + date window so caching is correct.
   * - `enabled` prevents calls when supplierId is empty.
   */
  const q = useQuery<LowStockRow[], Error>({
    queryKey: ['analytics', 'lowStock', supplierId, from ?? null, to ?? null],
    queryFn: () => getLowStockItems(supplierId, narrowParams({ from, to })),
    enabled,
    staleTime: 60_000,
  });

  // Conditional UI states

  if (!enabled) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        {t('analytics:selectSupplier', 'Select a supplier to see low stock')}
      </Box>
    );
  }

  if (q.isLoading) {
    return <Skeleton variant="rounded" height={220} />;
  }

  if (q.isError) {
    return (
      <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        {t('common:error', 'Error')}
      </Box>
    );
  }

  // Compute deficits and order by most severe first.
  const rows: Array<LowStockRow & { deficit: number }> = (q.data ?? [])
    .map((r) => ({
      ...r,
      deficit: Math.max(0, (r.minimumQuantity ?? 0) - (r.quantity ?? 0)),
    }))
    // Keep only items truly under/at threshold (deficit > 0).
    .filter((r) => r.deficit > 0 || (r.quantity ?? 0) <= (r.minimumQuantity ?? 0))
    .sort((a, b) => b.deficit - a.deficit);

  const visible = limit > 0 ? rows.slice(0, limit) : rows;

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
              {t('analytics:lowStock.columns.item', 'Item')}
            </TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>
              {t('analytics:lowStock.columns.quantity', 'Quantity')}
            </TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>
              {t('analytics:lowStock.columns.minimum', 'Minimum')}
            </TableCell>
            <TableCell align="right" sx={{ width: '15%' }}>
              {t('analytics:lowStock.columns.deficit', 'Deficit')}
            </TableCell>
            <TableCell align="left" sx={{ width: '15%', whiteSpace: 'nowrap' }}>
              {t('analytics:lowStock.columns.status', 'Status')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visible.map((r) => {
            const critical = r.deficit >= LOW_STOCK_CRITICAL_THRESHOLD;
            const warning = r.deficit > 0 && r.deficit < LOW_STOCK_CRITICAL_THRESHOLD;

            return (
              <TableRow key={r.itemName}>
                <TableCell 
                  component="th" 
                  scope="row"
                  sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {r.itemName}
                </TableCell>
                <TableCell align="right">{formatQty(r.quantity)}</TableCell>
                <TableCell align="right">{formatQty(r.minimumQuantity)}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: critical
                      ? muiTheme.palette.error.main
                      : warning
                        ? muiTheme.palette.warning.main
                        : muiTheme.palette.text.primary,
                  }}
                >
                  {formatQty(r.deficit)}
                </TableCell>
                <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                  {critical ? (
                    <Chip size="small" color="error" label={t('analytics:lowStock.status.critical', 'Critical')} />
                  ) : warning ? (
                    <Chip size="small" color="warning" label={t('analytics:lowStock.status.warning', 'Warning')} />
                  ) : (
                    <Chip size="small" color="success" label={t('analytics:lowStock.status.ok', 'OK')} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
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
