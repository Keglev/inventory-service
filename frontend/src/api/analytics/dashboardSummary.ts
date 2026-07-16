/**
 * @file dashboardSummary.ts
 * @module api/analytics/dashboardSummary
 *
 * @summary
 * Fetcher for GET /api/analytics/summary. The dashboard consumes only the
 * unfiltered (all-suppliers) low-stock list; the backend populates it when no
 * supplier filter is supplied and defaults the date window itself, so this
 * call needs no params. Tolerant per the analytics API house style: malformed
 * rows are dropped and transport errors collapse to an empty list.
 */
import http from '../httpClient';
import { isArrayOfRecords, pickString, pickNumber, type Rec } from './util';
import type { LowStockRow } from './types';

type SummaryShape = { lowStockItems?: unknown };

/**
 * Loads the global low-stock list from the dashboard summary endpoint.
 * @returns low-stock rows (most critical first, per backend order); [] on error
 */
export async function getDashboardLowStock(): Promise<LowStockRow[]> {
  try {
    const { data } = await http.get<unknown>('/api/analytics/summary');
    const rows = (data as SummaryShape | null)?.lowStockItems;
    if (!isArrayOfRecords(rows)) return [];
    return (rows as Rec[])
      .map<LowStockRow | null>((rec) => {
        const itemName = pickString(rec, ['itemName']);
        if (!itemName) return null;
        return {
          itemName,
          quantity: pickNumber(rec, ['quantity']),
          minimumQuantity: pickNumber(rec, ['minimumQuantity']),
        };
      })
      .filter((x): x is LowStockRow => x !== null);
  } catch {
    return [];
  }
}
