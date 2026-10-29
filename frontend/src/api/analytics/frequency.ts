/**
 * @file frequency.ts
 * @module api/analytics/frequency
 *
 * @summary
 * Supplier-scoped item update frequency (top N items by change count), from
 * GET /api/analytics/item-update-frequency?supplierId=...; maps
 * ItemUpdateFrequencyDTO (itemName, updateCount) to the canonical
 * {@link ItemUpdateFrequencyPoint} shape.
 *
 * @enterprise
 * The endpoint takes no limit, so the first N rows are kept on the client.
 * Returns [] on error or when supplierId is empty, so the chart shows its empty
 * state rather than an error.
 */

import http from '../httpClient';
import { isArrayOfRecords, firstNumberOrZero, firstStringOrEmpty } from './util';

/** A single data point: how many times a given item was updated in the window. */
export type ItemUpdateFrequencyPoint = { id: string; name: string; updates: number };

/**
 * Fetch the top `limit` items ranked by update count for a supplier.
 * Backend: GET /api/analytics/item-update-frequency?supplierId=...
 *
 * Fields read from ItemUpdateFrequencyDTO: `itemName` (also the row id, as the
 * DTO has none) and `updateCount`.
 */
export async function getItemUpdateFrequency(
  supplierId: string,
  limit = 10
): Promise<ItemUpdateFrequencyPoint[]> {
  if (!supplierId) return [];
  try {
    const { data } = await http.get<unknown>('/api/analytics/item-update-frequency', {
      params: { supplierId }
    });
    if (!isArrayOfRecords(data)) return [];

    return (data as Array<Record<string, unknown>>)
      .map((r) => {
        // ItemUpdateFrequencyDTO(itemName, updateCount) has no id: the name keys the row.
        const name = firstStringOrEmpty(r, ['itemName']);
        if (!name) return null;
        const updates = firstNumberOrZero(r, ['updateCount']);
        return { id: name, name, updates } as ItemUpdateFrequencyPoint;
      })
      .filter((x): x is ItemUpdateFrequencyPoint => x !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}
