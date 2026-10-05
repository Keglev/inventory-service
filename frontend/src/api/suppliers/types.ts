/**
 * @file types.ts
 * @module api/suppliers/types
 *
 * @summary
 * TypeScript types for the supplier API: the grid row and the create/update DTO.
 *
 * @enterprise
 * - Matches the backend SupplierDTO field names exactly — no MapStruct, manual mapping only.
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
