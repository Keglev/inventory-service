/**
 * @module api/analytics/types
 *
 * Canonical DTOs and narrow shared types for the analytics API layer.
 * Shapes are intentionally minimal and stable: UI components depend on them
 * directly, so backend field variations are absorbed by the fetch helpers
 * rather than propagated here. AnalyticsParams is defined in ./validation
 * (Zod schema) so type-safe parameter handling stays co-located with its
 * validation logic.
 */

/** Tracks aggregate portfolio value at a point in time; drives the stock-value trend chart. */
export type StockValuePoint = { date: string; totalValue: number };

/** Captures inbound and outbound stock volumes per calendar month; used by movement charts. */
export type MonthlyMovement = { month: string; stockIn: number; stockOut: number };

/** Represents a single price sample in an item's history; used by price-trend charts. */
export type PricePoint = { date: string; price: number };

/** Minimal item identity for type-ahead and dropdown controls; optional fields are included when callers need richer context (on-hand stock, price). */
export type ItemRef = { id: string; name: string; supplierId?: string | null; onHand?: number; price?: number };

/** Minimal supplier identity for selector controls that only need id and name. */
export type SupplierRef = { id: string; name: string };

/**
 * Supplier shape for UI option lists; uses `label` instead of `name` so
 * components with a uniform `{ id, label }` contract work without remapping.
 */
export type SupplierOption = { id: string; label: string };

/** Semantic alias for ItemRef so option-list consumers can name their dependency without coupling to the implementation type. */
export type ItemOption = ItemRef;

/** Low-stock alert row; carries both actual and threshold quantities so the table can render severity without recomputing. */
export type LowStockRow = { itemName: string; quantity: number; minimumQuantity: number };

/** Per-supplier inventory snapshot for distribution charts (donut, bar). */
export type StockPerSupplierPoint = { supplierName: string; totalQuantity: number };

/** Shared optional analytics filter state; centralised here so all analytics consumers import from one place. */
export type FiltersState = {
    from?: string;
    to?: string;
    supplierId?: string | null;
};
