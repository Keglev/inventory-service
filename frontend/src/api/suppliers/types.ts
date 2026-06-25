/**
 * @file types.ts
 * @module api/suppliers/types
 *
 * @summary
 * TypeScript types for the supplier API: DTOs, list params, and response shapes.
 *
 * @enterprise
 * - Matches the backend SupplierDTO field names exactly — no MapStruct, manual mapping only.
 * - SupplierListParams forwards client-managed page/pageSize/sort/q; backend has no server-side pagination.
 * - All optional fields are `string | null` to match the nullable columns in the backend entity.
 */

/** Supplier row shape displayed in grid. */
export interface SupplierRow {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  createdBy?: string | null;     // backend audit field; not user-editable
  createdAt?: string | null;     // ISO-8601 string; formatted for display only
}

/** Paginated response from /api/suppliers list endpoint. */
export interface SupplierListResponse {
  items: SupplierRow[];
  total: number;                 // equals items.length when backend returns a plain array
  page: number;                  // 1-based; mirrors the param sent in SupplierListParams
  pageSize: number;
}

/** Filter & pagination params for supplier list endpoint. */
export interface SupplierListParams {
  page: number;                  // 1-based
  pageSize: number;
  q?: string;                    // Search query (name/email)
  sort?: ServerSort;             // Sort expression, e.g., "name,asc"
}

/** Server-side sort expression. */
export type ServerSort = string;

/** Supplier DTO for create/update operations. */
export interface SupplierDTO {
  id?: string;                   // absent on POST; required on PUT
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;         // validated server-side if present
  createdBy?: string;            // auto-filled by backend; do not send on create
  createdAt?: string | null;     // auto-filled by backend; ISO-8601
}
