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
