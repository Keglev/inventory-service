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
 * - Deficit thresholds encode the same low-stock business rule used in
 *   the analytics LowStockTable, via LOW_STOCK_CRITICAL_THRESHOLD and
 *   DEFAULT_MIN_QUANTITY from config/inventoryPolicy.
 * - Empty-string return for the default case keeps DataGrid's row class
 *   list empty for normal rows, avoiding a CSS rule for the default.
 */

/**
 * Hook to generate row styling function for inventory items.
 * 
 * Applies visual styling based on stock deficit:
 * - Critical (red): deficit >= 5
 * - Warning (orange): deficit > 0 and < 5
 * - Normal: deficit <= 0
 * 
 * @returns Function that takes (onHand, minQty) and returns CSS class name
 */
import { DEFAULT_MIN_QUANTITY, LOW_STOCK_CRITICAL_THRESHOLD } from '../../../config/inventoryPolicy';

export const useInventoryRowStyling = (): ((onHand: number, minQty: number) => string) => {
  return (onHand: number, minQty: number): string => {
    const minRaw = Number(minQty ?? 0);
    const min = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : DEFAULT_MIN_QUANTITY;
    const deficit = min - Number(onHand ?? 0);

    if (deficit >= LOW_STOCK_CRITICAL_THRESHOLD) return 'row-critical';
    if (deficit > 0) return 'row-warning';
    return '';
  };
};
