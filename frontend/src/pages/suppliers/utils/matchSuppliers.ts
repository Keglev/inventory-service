/**
 * @file matchSuppliers.ts
 * @module pages/suppliers/utils/matchSuppliers
 *
 * @summary
 * Filters the supplier list by a typed name fragment, in the browser.
 *
 * @enterprise
 * - Supplier search runs on the full list the app already holds
 *   (GET /api/suppliers, cached by React Query), not as one request per
 *   keystroke (frontend ADR-0014).
 * - The rule matches the backend's search: case-insensitive, the fragment
 *   anywhere in the name, at least SUPPLIER_SEARCH_MIN_CHARS characters
 *   after trimming.
 */

import type { SupplierRow } from '../../../api/suppliers/types';

/** Characters a fragment needs before any supplier matches. */
export const SUPPLIER_SEARCH_MIN_CHARS = 2;

/**
 * Suppliers whose name contains the fragment, case-insensitively, in list
 * order; [] while the fragment is shorter than SUPPLIER_SEARCH_MIN_CHARS.
 */
export function matchSuppliers(suppliers: readonly SupplierRow[], query: string): SupplierRow[] {
  const fragment = query.trim().toLowerCase();
  if (fragment.length < SUPPLIER_SEARCH_MIN_CHARS) return [];
  return suppliers.filter((s) => s.name.toLowerCase().includes(fragment));
}
