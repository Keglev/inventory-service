/**
 * @module api/inventory/supplierQueries
 *
 * Supplier listing and item-search queries used by inventory UI flows.
 * Hits GET /api/suppliers for supplier dropdowns and
 * GET /api/inventory/search for supplier-scoped item type-ahead.
 * Both functions absorb response-shape variations and never throw,
 * making them safe to use directly with React Query without extra guards.
 */

import http from '../httpClient';
import { isRecord, pickString, pickNumber, resDataOrEmpty, INVENTORY_BASE } from '@/api/shared';

export { INVENTORY_BASE };
/** Suppliers domain API base path. */
export const SUPPLIERS_BASE = '/api/suppliers';

/**
 * Fetches all suppliers from GET /api/suppliers for use in selection dropdowns.
 * Requests pageSize=1000 to load all suppliers in a single call, avoiding
 * pagination complexity in dropdown controls.
 * GET /api/suppliers returns a plain array (List<SupplierDTO>).
 *
 * @returns Array of supplier options with id and name, or [] on any error
 *
 * @example
 * ```typescript
 * const suppliers = await listSuppliers();
 * // [{ id: 'SUP-001', name: 'Supplier A' }, ...]
 * ```
 */
export async function listSuppliers(): Promise<Array<{ id: string | number; name: string }>> {
  try {
    const resData = resDataOrEmpty(await http.get(SUPPLIERS_BASE, { params: { pageSize: 1000 } }));
    const candidates: unknown[] = Array.isArray(resData) ? resData : [];

    const out: Array<{ id: string | number; name: string }> = [];
    for (const entry of candidates) {
      if (!isRecord(entry)) continue;

      const idStr =
        pickString(entry, 'id') ??
        pickString(entry, 'supplierId') ??
        pickString(entry, 'supplier_id');

      const idNum = pickNumber(entry, 'supplierId');
      const id: string | number | null = idStr ?? (typeof idNum === 'number' ? idNum : null);

      const name =
        pickString(entry, 'name') ??
        pickString(entry, 'supplierName') ??
        pickString(entry, 'supplier');

      if (id != null && name) out.push({ id, name });
    }
    return out;
  } catch {
    return [];
  }
}
