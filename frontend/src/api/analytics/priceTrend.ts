/**
* @file priceTrend.ts
* @module api/analytics/priceTrend
*
* @summary
* Price trend time series for a given item within an optional date/supplier window.
* Provides function to fetch historical price points.
* @enterprise
* - Resilient data fetching with graceful error handling
* - TypeDoc documentation for price trend analytics function
*/
import http from '../httpClient';
import { asNumber, paramClean } from './util';
import type { AnalyticsParams } from './validation';
import type { PricePoint } from './types';

// Tolerant DTO (local)
type BackendPriceTrendDTO = { timestamp?: string; price?: unknown };

/** Fetch an item's price trend in a time window. 
 * Returns array of {date, price}. Empty array on errors.
 * @example
 * ```typescript
 * const points = await getPriceTrend('ITEM-123', {
 *   from: '2025-09-01',
 *  to: '2025-11-30',
 *  supplierId: 'SUP-001'
 * });
 * return <LineChart data={points} />;
 * ```
*/
export async function getPriceTrend(itemId: string, p?: AnalyticsParams): Promise<PricePoint[]> {
    if (!itemId) return [];
    try {
        const { data } = await http.get<unknown>('/api/analytics/price-trend', {
            params: { itemId, ...paramClean(p) },
        });
        if (!Array.isArray(data)) return [];
        const rows = (data as BackendPriceTrendDTO[]).map((d) => ({
            date: String(d.timestamp ?? ''),
            price: asNumber(d.price),
        }));
        rows.sort((a, b) => a.date.localeCompare(b.date));
        return rows;
    } catch {
        return [];
    }
}