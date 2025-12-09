/**
* @file frequency.ts
* @module api/analytics/frequency
*
* @summary
* Supplier-scoped item update frequency (top N items by change count).
* Fetches and normalizes item update frequency data.
* @enterprise
* - Resilient data fetching with graceful error handling
* - Flexible field recognition for robust parsing
* - TypeDoc documentation for item frequency analytics function
*/

import http from '../httpClient';
import { isArrayOfRecords, pickNumber, pickString } from './util';


export type ItemUpdateFrequencyPoint = { id: string; name: string; updates: number };

/**
 * GET /api/analytics/item-update-frequency?supplierId=...&limit=N
 * Accepts either:
 *   - { id, name, updates } or
 *   - { itemId?, itemName, updates|updateCount|count }
 *
 * If no id is present, uses the name as a stable id.
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

    // Parse and normalize records
    return (data as Array<Record<string, unknown>>)
      .map((r) => {
        // tolerant name/id picking
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
