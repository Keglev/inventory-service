/**
 * @file LowStockTable.types.ts
 * @description
 * Type definitions for low stock table functionality.
 * Defines component props and internal status computation types.
 */

import type { AnalyticsParams } from '../../../../api/analytics';

/**
 * Props for the LowStockTable component
 */
export interface LowStockTableProps {
  /** Required supplier ID to fetch low stock items for */
  supplierId: string;
  /** Optional ISO date (YYYY-MM-DD) for lower bound */
  from?: string;
  /** Optional ISO date (YYYY-MM-DD) for upper bound */
  to?: string;
  /** Maximum rows to display (0 = show all). @defaultValue 12 */
  limit?: number;
}

/**
 * Internal row with computed deficit value
 */
export interface LowStockRowWithDeficit {
  itemName: string;
  quantity: number;
  minimumQuantity: number;
  deficit: number;
}

/**
 * Status level for a low stock item
 */
export type LowStockStatus = 'critical' | 'warning' | 'ok';

/**
 * Narrow filter params to only allowed keys
 * @internal
 */
export function narrowParams(p: Pick<AnalyticsParams, 'from' | 'to'>): AnalyticsParams {
  const out: AnalyticsParams = {};
  if (p.from) out.from = p.from;
  if (p.to) out.to = p.to;
  return out;
}
