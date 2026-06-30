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
 *   the analytics LowStockTable: critical when deficit >= 5, warning
 *   when deficit is 1-4, default otherwise. Tracked under CB-APP42 --
 *   the literal 5 appears here twice (fallback and threshold) and again
 *   in useInventoryPageData; extract to a shared constant in the refactor
 *   phase.
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
export const useInventoryRowStyling = (): ((onHand: number, minQty: number) => string) => {
  return (onHand: number, minQty: number): string => {
    const minRaw = Number(minQty ?? 0);
    // BUCKET: CB-APP42 -- duplicated low-stock threshold (5). Extract to shared constant.
    const min = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : 5;
    const deficit = min - Number(onHand ?? 0);

    if (deficit >= 5) return 'row-critical';
    if (deficit > 0) return 'row-warning';
    return '';
  };
};
