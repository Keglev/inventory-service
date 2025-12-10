/**
 * @file supplierQueries.ts
 * @module api/inventory/supplierQueries
 *
 * @summary
 * Supplier and item search query operations.
 * Provides supplier listings and supplier-scoped item type-ahead.
 *
 * @enterprise
 * - Tolerant response parsing: accepts multiple envelope formats
 * - Flexible field mapping: handles backend field name variations
 * - Never throws: returns empty arrays on any error
 * - Suitable for React Query integration
 */

import http from '../httpClient';
import type { ItemRef } from '../analytics/types';
import {
  isRecord,
  pickString,
  pickNumber,
  resDataOrEmpty,
  extractArray,
} from './utils';

/** Centralized endpoint bases. */
export const INVENTORY_BASE = '/api/inventory';
export const SUPPLIERS_BASE = '/api/suppliers';

/**
 * Fetch supplier list for selection dropdowns.
 * Accepts raw array OR envelopes { items: [...] } / { content: [...] }.
 * Tolerant: returns empty array on any error.
 *
 * @returns Array of supplier options with id and name
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
 * Search items by supplier (type-ahead for item pickers).
 * Supplier-scoped item search with tolerant response parsing.
 *
 * @param supplierId - Supplier to search within
 * @param q - Search query string
 * @returns Array of matching item references with id, name, and supplierId
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
