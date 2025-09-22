/**
* @file priceTrend.ts
* @module api/analytics/priceTrend
*
* @summary
* Price trend time series for a given item within an optional date/supplier window.
*/
import http from '../httpClient';
import { asNumber, paramClean } from './util';
import type { AnalyticsParams, PricePoint } from './types';

// Tolerant DTO (local)
type BackendPriceTrendDTO = { timestamp?: string; price?: unknown };

/** Fetch an item's price trend in a time window. */
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