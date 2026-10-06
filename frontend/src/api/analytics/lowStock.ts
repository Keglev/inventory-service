/**
 * @module api/analytics/lowStock
 *
 * Fetches and normalises low-stock alert rows from `GET /api/analytics/low-stock-items`.
 * Reads the bare List<LowStockItemDTO> the backend returns (no envelope) by
 * the DTO's field names, and sorts results by deficit severity.
 */

import http from '../httpClient';
import { isArrayOfRecords, firstNumberOrZero, firstStringOrEmpty, paramClean } from './util';
import type { AnalyticsParams } from './validation';
import type { LowStockRow } from './types';

/**
 * Tolerant fetch of `GET /api/analytics/low-stock-items` for one supplier.
 * Reads LowStockItemDTO's field names from a bare array; returns `[]`
 * on any error so the table renders empty rather than crashing.
 */
export async function getLowStockItems(supplierId: string, p?: AnalyticsParams): Promise<LowStockRow[]> {
    if (!supplierId) return [];
    try {
        const { data } = await http.get<unknown>('/api/analytics/low-stock-items', {
            params: { supplierId, ...paramClean(p) },
        });

        const rawList: Array<Record<string, unknown>> = isArrayOfRecords(data) ? data : [];

        const rows: LowStockRow[] = rawList
        .map((rec) => {
            // LowStockItemDTO field names.
            const itemName = firstStringOrEmpty(rec, ['itemName']);
            const quantity = firstNumberOrZero(rec, ['quantity']);
            const minimumQuantity = firstNumberOrZero(rec, ['minimumQuantity']);
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
