/**
 * @file useLowStockRows.ts
 * @module pages/analytics/hooks/useLowStockRows
 * @summary Query plus client-side deficit derivation for the low-stock table.
 * @enterprise
 * Extracted from LowStockTable so the business rule lives apart from the
 * markup and is unit-testable without rendering. BUSINESS RULE: the deficit
 * is `minimumQuantity - quantity` (floored at 0) and is computed here, not
 * by the backend; an item is "low stock" when its deficit is positive or
 * its quantity is at/below the minimum. Rows are ordered by deficit
 * descending so the most urgent items come first, and the optional limit
 * caps the visible slice while `total` lets callers report the cap
 * ("Showing n of m"). The query is unconditional and gated with `enabled`
 * to comply with the Rules of Hooks; the key includes supplier and date
 * window so the cache stays correct across filter changes.
 */
import { useQuery } from '@tanstack/react-query';
import { getLowStockItems } from '../../../api/analytics/lowStock';
import type { LowStockRow } from '../../../api/analytics/types';
import type { AnalyticsParams } from '../../../api/analytics/validation';

/** A low-stock row enriched with the client-computed deficit. @public */
export type LowStockDerivedRow = LowStockRow & { deficit: number };

/** Result surface consumed by the table component. @public */
export type UseLowStockRowsResult = {
  /** False when no supplier is selected; the query does not run. */
  enabled: boolean;
  /** True while the enabled query is loading. */
  isLoading: boolean;
  /** True when the query failed. */
  isError: boolean;
  /** Rows to render, ordered by deficit descending, capped by `limit`. */
  visible: LowStockDerivedRow[];
  /** Total matching rows before the cap (for "Showing n of m"). */
  total: number;
};

/** Narrow filter params to only allowed keys for the low-stock endpoint. @internal */
function narrowParams(p: Pick<AnalyticsParams, 'from' | 'to'>): AnalyticsParams {
  const out: AnalyticsParams = {};
  if (p.from) out.from = p.from;
  if (p.to) out.to = p.to;
  return out;
}

/**
 * Loads low-stock items for a supplier and derives the ordered deficit rows.
 *
 * @param supplierId - Supplier whose items are evaluated; empty disables the query.
 * @param from - Optional ISO date (YYYY-MM-DD) lower bound.
 * @param to - Optional ISO date (YYYY-MM-DD) upper bound.
 * @param limit - Max visible rows; `0` shows all.
 * @returns Query state plus the derived visible slice and total count.
 * @public
 */
export function useLowStockRows(
  supplierId: string,
  from: string | undefined,
  to: string | undefined,
  limit: number,
): UseLowStockRowsResult {
  const enabled = Boolean(supplierId);

  const q = useQuery<LowStockRow[], Error>({
    queryKey: ['analytics', 'lowStock', supplierId, from ?? null, to ?? null],
    queryFn: () => getLowStockItems(supplierId, narrowParams({ from, to })),
    enabled,
    staleTime: 60_000,
  });

  const rows: LowStockDerivedRow[] = (q.data ?? [])
    .map((r) => ({
      ...r,
      deficit: Math.max(0, (r.minimumQuantity ?? 0) - (r.quantity ?? 0)),
    }))
    // Keep only items truly under/at threshold.
    .filter((r) => r.deficit > 0 || (r.quantity ?? 0) <= (r.minimumQuantity ?? 0))
    .sort((a, b) => b.deficit - a.deficit);

  const visible = limit > 0 ? rows.slice(0, limit) : rows;

  return { enabled, isLoading: q.isLoading, isError: q.isError, visible, total: rows.length };
}
