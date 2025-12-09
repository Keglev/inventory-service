/**
* @file lowStock.ts
* @module api/analytics/lowStock
*
* @summary
* Low-stock table: tolerant parsing + severity sorting.
* Fetches and normalizes low-stock item data for a given supplier.
* @enterprise
* - Robust data parsing with flexible field recognition
* - Severity-based sorting for actionable insights
* - TypeDoc documentation for low-stock analytics function
*/

import http from '../httpClient';
import { isArrayOfRecords, isRecord, pickNumber, pickString, paramClean } from './util';
import type { AnalyticsParams } from './validation';
import type { LowStockRow } from './types';


/** Fetch low-stock rows for a given supplier, optionally bounded by dates. 
 * Returns array of {itemName, quantity, minimumQuantity}. Empty array on errors.
 * @example
 * ```typescript
 * const lowStockItems = await getLowStockItems('SUP-001', {
 *  from: '2025-09-01',
 * to: '2025-11-30'
 * });
 * return <AlertTable data={lowStockItems} />;
 * ```
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
        
        // Parse rows with tolerant field picking
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