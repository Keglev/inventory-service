/**
* @file types.ts
* @module api/analytics/types
*
* @summary
* Public DTOs and narrow types shared across Analytics API helpers.
* These are intentionally minimal and stable so UI components can rely
* on consistent shapes regardless of backend field variations.
*/

/** Optional filters accepted by most analytics endpoints. Dates are ISO `YYYY-MM-DD` in local time. */
export type AnalyticsParams = {
    from?: string;
    to?: string;
    supplierId?: string;
};

/** Canonical chart/table DTOs exposed to the UI. */
export type StockValuePoint = { date: string; totalValue: number };
export type MonthlyMovement = { month: string; stockIn: number; stockOut: number };
export type PricePoint = { date: string; price: number };

/** Lightweight item reference used by type-ahead and dropdowns. */
export type ItemRef = { id: string; name: string; supplierId?: string | null; onHand?: number; price?: number };

/** Minimal supplier projection for selectors. */
export type SupplierRef = { id: string; name: string };

/** Supplier option for UI components - includes label for display. */
export type SupplierOption = { id: string; label: string };

/** Item option for UI components - same as ItemRef. */
export type ItemOption = ItemRef;

/** Low-stock row used by the low-stock table. */
export type LowStockRow = { itemName: string; quantity: number; minimumQuantity: number };

/** Snapshot of totals per supplier for the donut/bar chart. */
export type StockPerSupplierPoint = { supplierName: string; totalQuantity: number };

/** Optional, shared filter state (kept here for consumers that import from this module). */
export type FiltersState = {
    from?: string;
    to?: string;
    supplierId?: string | null;
};