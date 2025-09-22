/**
* @file frequency.ts
* @module api/analytics/frequency
*
* @summary
* Supplier-scoped item update frequency (top N items by change count).
*/


import http from '../httpClient';
import { normalizeItemsList, isArrayOfRecords, pickNumber } from './util';


export type ItemUpdateFrequencyPoint = { id: string; name: string; updates: number };


/**
* GET /api/analytics/item-update-frequency?supplierId=...&limit=10
*/
export async function getItemUpdateFrequency(
  supplierId: string,
  limit = 10
): Promise<ItemUpdateFrequencyPoint[]> {
  if (!supplierId) return [];
  try {
    const { data } = await http.get<unknown>('/api/analytics/item-update-frequency', {
      params: { supplierId, limit },
    });

    // Accept only arrays of plain records
    if (!isArrayOfRecords(data)) return [];

    // Accept either { id, name, updates } or any item-like + a numeric count field
    return (data as Array<Record<string, unknown>>)
      .map((r) => {
        const [item] = normalizeItemsList([r]);
        const updates = pickNumber(r, ['updates', 'count', 'changes']); // tolerate different field names
        return item ? { id: item.id, name: item.name, updates } : null;
      })
      .filter((x): x is ItemUpdateFrequencyPoint => x !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}