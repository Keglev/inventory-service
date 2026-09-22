/**
 * @file useInventoryRowStyling.ts
 * @module pages/inventory/hooks/useInventoryRowStyling
 *
 * @summary
 * Returns a pure function that maps (onHand, minQty) to a CSS class name
 * for inventory DataGrid rows: critical, warning, or default (empty).
 *
 * @enterprise
 * - Returned from a hook for call-site symmetry with useInventoryColumns,
 *   not because it consumes context. The returned function is pure.
 * - The bands come from lowStockSeverity (config/inventoryPolicy), the same
 *   rule the analytics LowStockTable uses, so the two views cannot disagree.
 * - Empty-string return for the default case keeps DataGrid's row class
 *   list empty for normal rows, avoiding a CSS rule for the default.
 */

import { lowStockSeverity, type LowStockSeverity } from '../../../config/inventoryPolicy';

const ROW_CLASS: Record<LowStockSeverity, string> = {
  critical: 'row-critical',
  warning: 'row-warning',
  none: '',
};

/**
 * Hook to generate the row styling function for inventory items.
 *
 * @returns Function that takes (onHand, minQty) and returns the CSS class name
 */
export const useInventoryRowStyling = (): ((onHand: number, minQty: number) => string) => {
  return (onHand: number, minQty: number): string =>
    ROW_CLASS[lowStockSeverity(Number(onHand ?? 0), Number(minQty ?? 0))];
};
