/**
 * @module api/analytics/frequency
 *
 * Supplier-scoped item update frequency (top N items by change count).
 * Calls GET /api/analytics/item-update-frequency?supplierId=...&limit=N.
 * Returns [] on error or when supplierId is empty. Normalises several backend
 * field aliases to the canonical {@link ItemUpdateFrequencyPoint} shape.
 */

import http from '../httpClient';
import { isArrayOfRecords, pickNumber, pickString } from './util';

/** A single data point: how many times a given item was updated in the window. */
export type ItemUpdateFrequencyPoint = { id: string; name: string; updates: number };

/**
 * Fetch the top `limit` items ranked by update count for a supplier.
 * Backend: GET /api/analytics/item-update-frequency?supplierId=...&limit=N
 *
 * Field aliases accepted from the backend:
 *   - id:      `id` | `itemId` | `sku` | `code`, falls back to `name` when absent
 *   - name:    `name` | `itemName`
 *   - updates: `updates` | `updateCount` | `updatesCount` | `count` | `changes`
 */
export async function getItemUpdateFrequency(
  supplierId: string,
  limit = 10
): Promise<ItemUpdateFrequencyPoint[]> {
  if (!supplierId) return [];
  try {
    const { data } = await http.get<unknown>('/api/analytics/item-update-frequency', {
      params: { supplierId, limit }
    });
    if (!isArrayOfRecords(data)) return [];

    return (data as Array<Record<string, unknown>>)
      .map((r) => {
        const name = pickString(r, ['name', 'itemName']);
        if (!name) return null;
        const id = pickString(r, ['id', 'itemId', 'sku', 'code']) || name;
        const updates = pickNumber(r, ['updates', 'updateCount', 'updatesCount', 'count', 'changes']);
        return { id, name, updates } as ItemUpdateFrequencyPoint;
      })
      .filter((x): x is ItemUpdateFrequencyPoint => x !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}
