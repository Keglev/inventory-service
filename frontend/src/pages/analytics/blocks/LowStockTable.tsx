/**
 * @file LowStockTable.tsx
 * @module pages/analytics/blocks/LowStockTable
 * @category Analytics
 *
 * @summary
 * Renders a low-stock table for a selected supplier. The table shows
 * item name, current quantity, minimum threshold, a computed “deficit”,
 * and a status chip (OK / Warning / Critical).
 *
 * @remarks
 * - Data source: `GET /api/analytics/low-stock-items?supplierId=...&start=...&end=...`
 * - Query is disabled when no supplierId is provided (via React Query `enabled`).
 * - DTOs are normalized in the API layer; this component assumes:
 *   `{ itemName: string, quantity: number, minimumQuantity: number }`.
 * - Uses plain MUI Table for portability.
 */

import type { JSX } from 'react';
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
import { getLowStockItems, type LowStockRow, type AnalyticsParams } from '../../../api/analytics';

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

/** Format a number for table cells. Falls back to "0" for invalid values. @internal */
function fmt(n: number | undefined | null): string {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return String(v);
}

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
 * @description
 * Displays items at or below minimum quantity for a given supplier. The query
 * is **always declared** (top-level Hook) and **conditionally enabled** using
 * React Query’s `enabled` flag, thereby complying with the Rules of Hooks.
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
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>{t('analytics:lowStock.columns.item', 'Item')}</TableCell>
            <TableCell align="right">{t('analytics:lowStock.columns.quantity', 'Quantity')}</TableCell>
            <TableCell align="right">{t('analytics:lowStock.columns.minimum', 'Minimum')}</TableCell>
            <TableCell align="right">{t('analytics:lowStock.columns.deficit', 'Deficit')}</TableCell>
            <TableCell align="left">{t('analytics:lowStock.columns.status', 'Status')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visible.map((r) => {
            const critical = r.deficit >= 5; // tweak policy if needed
            const warning = r.deficit > 0 && r.deficit < 5;

            return (
              <TableRow key={r.itemName}>
                <TableCell component="th" scope="row">
                  {r.itemName}
                </TableCell>
                <TableCell align="right">{fmt(r.quantity)}</TableCell>
                <TableCell align="right">{fmt(r.minimumQuantity)}</TableCell>
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
                  {fmt(r.deficit)}
                </TableCell>
                <TableCell align="left">
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
