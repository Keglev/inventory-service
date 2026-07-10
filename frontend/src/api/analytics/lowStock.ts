/**
 * @module api/analytics/lowStock
 *
 * Fetches and normalises low-stock alert rows from `GET /api/analytics/low-stock-items`.
 * Handles two backend response shapes (bare array or `{ items: [] }` envelope),
 * multiple field-name variants per column, and sorts results by deficit severity.
 */

import http from '../httpClient';
import { isArrayOfRecords, pickNumber, pickString, paramClean } from './util';
import { isRecord } from '../shared/typeGuards';
import type { AnalyticsParams } from './validation';
import type { LowStockRow } from './types';

/**
 * Tolerant fetch of `GET /api/analytics/low-stock-items` for one supplier.
 * Handles field-name variants and two backend response shapes; returns `[]`
 * on any error so the table renders empty rather than crashing.
 */
export async function getLowStockItems(supplierId: string, p?: AnalyticsParams): Promise<LowStockRow[]> {
    if (!supplierId) return [];
    try {
        const { data } = await http.get<unknown>('/api/analytics/low-stock-items', {
            params: { supplierId, ...paramClean(p) },
        });

        // Accept either a direct array or an envelope with `.items` array.
        let rawList: Array<Record<string, unknown>> = [];
        if (isArrayOfRecords(data)) rawList = data;
        else if (isRecord(data) && isArrayOfRecords((data as Record<string, unknown>).items as unknown)) rawList = (data as Record<string, unknown>).items as Array<Record<string, unknown>>;

        const rows: LowStockRow[] = rawList
        .map((rec) => {
            const itemName = pickString(rec, ['itemName', 'name']);
            const quantity = pickNumber(rec, ['quantity', 'qty', 'currentQty']);
            const minimumQuantity = pickNumber(rec, ['minimumQuantity', 'minQuantity', 'minQty', 'minimum']);
            return itemName ? { itemName, quantity, minimumQuantity } : null;
        })
        .filter((x): x is LowStockRow => x !== null);

        // Sort by severity (deficit descending)
        rows.sort((a, b) => (b.minimumQuantity - b.quantity) - (a.minimumQuantity - a.quantity));
        return rows;
    } catch {
        return [];
    }
}
