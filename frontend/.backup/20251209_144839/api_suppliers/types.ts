/**
 * @file types.ts
 * @module api/suppliers/types
 *
 * @summary
 * TypeScript type definitions for supplier API responses and list operations.
 * Centralizes all supplier-related types for consistent frontend handling.
 *
 * @enterprise
 * - No `any` types; all responses are fully typed
 * - Matches backend SupplierDTO structure
 * - Supports filtering, pagination, and sorting
 * - Comprehensive TypeDoc for all exports
 */

/** Supplier row shape displayed in grid. */
export interface SupplierRow {
  id: string;                    // Unique supplier identifier
  name: string;                  // Supplier company name
  contactName?: string | null;   // Contact person name (optional)
  phone?: string | null;         // Contact phone (optional)
  email?: string | null;         // Contact email (optional)
  createdBy?: string | null;     // Who created (audit trail)
  createdAt?: string | null;     // ISO datetime created
}

/** Paginated response from /api/suppliers list endpoint. */
export interface SupplierListResponse {
  items: SupplierRow[];
  total: number;                 // Total count across all pages
  page: number;                  // 1-based page index
  pageSize: number;              // Items per page
}

/** Filter & pagination params for supplier list endpoint. */
export interface SupplierListParams {
  page: number;                  // 1-based page index
  pageSize: number;              // Page size
  q?: string;                    // Search query (name/email)
  sort?: ServerSort;             // Sort expression, e.g., "name,asc"
}

/** Server-side sort expression. */
export type ServerSort = string;

/** Supplier DTO for create/update operations. */
export interface SupplierDTO {
  id?: string;                   // Absent for POST, required for PUT
  name: string;                  // Required
  contactName?: string | null;   // Optional
  phone?: string | null;         // Optional
  email?: string | null;         // Optional email (validated if provided)
  createdBy?: string;            // Auto-filled by backend
  createdAt?: string | null;     // Auto-filled by backend (ISO datetime)
}
