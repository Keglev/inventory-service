/**
 * @file useInventoryRowStyling.ts
 * @module pages/inventory/hooks/useInventoryRowStyling
 *
 * @summary
 * Row styling logic based on stock levels.
 * Extracted from useInventoryData for single responsibility.
 *
 * @enterprise
 * - Pure function for row class determination
 * - CSS class names for critical/warning/normal stock levels
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
    const min = Number.isFinite(minRaw) && minRaw > 0 ? minRaw : 5;
    const deficit = min - Number(onHand ?? 0);

    if (deficit >= 5) return 'low-stock-critical';
    if (deficit > 0) return 'low-stock-warning';
    return '';
  };
};
