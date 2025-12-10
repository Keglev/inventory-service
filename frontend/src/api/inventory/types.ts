/**
 * @file types.ts
 * @module api/inventory/types
 *
 * @summary
 * Type-safe shapes for Inventory list operations.
 * These DTOs reflect the *normalized* shapes the frontend relies on,
 * not necessarily the raw backend payloads.
 *
 * @enterprise
 * Keep these minimal and stable. Prefer widening unknown fields to narrow types
 * at the edge (parsers) so that the UI is resilient to backend changes.
 */

/** Server sort expression (e.g., "name,asc" or "onHand,desc"). */
export type ServerSort = string;

/** Filter & pagination params accepted by the list endpoint. */
export interface InventoryListParams {
  /** 1-based page index expected by the backend. */
  page: number;
  /** Page size (rows per page). */
  pageSize: number;
  /** Search term (name/code); empty string for no search. */
  q?: string;
  /** Filter by supplier id (string/number). */
  supplierId?: string | number;
  /** Sort expression, e.g., "name,asc". */
  sort?: ServerSort;
}

/** Inventory row shape used by the grid. */
export interface InventoryRow {
  id: string;            // UI-stable id (string for consistency)
  name: string;
  code?: string | null;  // Code/SKU (nullable – DB may not have SKU yet)
  supplierName?: string | null;
  supplierId?: string | number | null;
  onHand: number;        // current stock
  minQty?: number | null;
  updatedAt?: string | null; // ISO datetime
}

/** Paged response envelope. */
export interface InventoryListResponse {
  items: InventoryRow[];
  total: number;
  page: number;      // echo of the 1-based page index
  pageSize: number;  // echo of page size
}

/**
 * Full item details fetched from backend /api/inventory/{id} endpoint.
 * Contains complete item information including actual current values.
 * Used by forms and dialogs to display/edit full item data.
 *
 * @remarks
 * This interface represents the complete item data fetched after user selects an item.
 * Use this for displaying actual current values and pre-filling forms.
 */
export interface ItemDetails {
  /** Unique item identifier */
  id: string;
  /** Item display name */
  name: string;
  /** Actual current quantity on hand (from backend) */
  onHand: number;
  /** Actual current price per unit (from backend) */
  price: number;
  /** Item code/SKU (nullable) */
  code: string | null;
  /** Associated supplier identifier (nullable) */
  supplierId: string | number | null;
}

/**
 * Create or update request shape (UI → API).
 * When id is undefined, operation is create; when present, it's update.
 */
export interface UpsertItemRequest {
  /** undefined → create, present → update */
  id?: string;
  name: string;
  /** Code/SKU (nullable – DB may not have SKU yet) */
  code?: string | null;
  supplierId: string | number;
  /** Initial quantity for new items */
  quantity: number;
  /** Unit price */
  price: number;
  /** Minimum quantity threshold - will be auto-set to 5 if not provided */
  minQty?: number | null;
  /** Notes/reason for creation */
  notes?: string | null;
  /** Created by user - required for backend validation */
  createdBy?: string;
}

/**
 * Upsert operation response with item data or error.
 */
export interface UpsertItemResponse {
  ok: boolean;
  item?: InventoryRow;
  error?: string;
}

/**
 * Stock adjustment request (purchase-like delta).
 * Positive delta = purchase/inbound; negative = correction/outbound.
 */
export interface AdjustQuantityRequest {
  id: string;
  /** Positive = purchase/inbound; negative = correction/outbound. */
  delta: number;
  /** Business reason (server may map to enum). */
  reason: string;
}

/**
 * Price change request for item unit price update.
 */
export interface ChangePriceRequest {
  id: string;
  /** New unit price. */
  price: number;
}
