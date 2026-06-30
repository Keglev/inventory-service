/**
 * @module api/inventory/supplierQueries
 *
 * Supplier listing and item-search queries used by inventory UI flows.
 * Hits GET /api/suppliers for supplier dropdowns and
 * GET /api/inventory/search for supplier-scoped item type-ahead.
 * Both functions absorb response-shape variations and never throw,
 * making them safe to use directly with React Query without extra guards.
 *
 * Note: INVENTORY_BASE is duplicated from other inventory modules;
 * consolidation is a deferred structural item.
 */

import http from '../httpClient';
import type { ItemRef } from '../analytics/types';
import { isRecord, pickString, pickNumber, resDataOrEmpty, extractArray } from '@/api/shared';

/** Inventory API base path; duplicated from other inventory modules pending a shared constants file. */
export const INVENTORY_BASE = '/api/inventory';
/** Suppliers domain API base path. */
export const SUPPLIERS_BASE = '/api/suppliers';

/**
 * Fetches all suppliers from GET /api/suppliers for use in selection dropdowns.
 * Requests pageSize=1000 to load all suppliers in a single call, avoiding
 * pagination complexity in dropdown controls.
 * Accepts raw array or envelopes { items: [...] } / { content: [...] }.
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
    const candidates: unknown[] = Array.isArray(resData)
      ? resData
      : extractArray(resData, ['items', 'content']);

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

/**
 * Searches inventory items by supplier via GET /api/inventory/search,
 * used for type-ahead item pickers filtered to a specific supplier.
 * Tolerant parsing handles multiple field-name conventions from the backend.
 *
 * @param supplierId - Supplier to scope the search to
 * @param q - Search query string for type-ahead matching
 * @returns Matching ItemRef array, or [] on any error
 *
 * @example
 * ```typescript
 * const items = await searchItemsBySupplier('SUP-001', 'widget');
 * // [{ id: 'ITEM-123', name: 'Widget A', supplierId: 'SUP-001' }, ...]
 * ```
 */
export async function searchItemsBySupplier(
  supplierId: string | number,
  q: string
): Promise<ItemRef[]> {
  try {
    const resData = resDataOrEmpty(
      await http.get(`${INVENTORY_BASE}/search`, { params: { supplierId, q } })
    );
    const candidates = Array.isArray(resData)
      ? (resData as unknown[])
      : extractArray(resData, ['items', 'content']);

    const out: ItemRef[] = [];
    for (const entry of candidates) {
      if (!isRecord(entry)) continue;

      const id =
        pickString(entry, 'id') ??
        pickString(entry, 'itemId') ??
        pickString(entry, 'item_id');
      if (!id) continue;

      const name =
        pickString(entry, 'name') ??
        pickString(entry, 'itemName') ??
        '—';

      const sIdStr =
        pickString(entry, 'supplierId') ??
        pickString(entry, 'supplier_id');
      const sIdNum = pickNumber(entry, 'supplierId');

      out.push({
        id,
        name,
        supplierId: sIdStr ?? (typeof sIdNum === 'number' ? sIdNum : supplierId),
      } as ItemRef);
    }
    return out;
  } catch {
    return [];
  }
}
