/**
 * @module api/analytics/priceTrend
 *
 * Historical price trend for a single item, fetched from
 * GET /api/analytics/price-trend. The backend requires `start` and `end`, so
 * `paramClean` always supplies them (defaulting to the last 180 days).
 * Returns an empty array on any error.
 */
import http from '../httpClient';
import { asNumber, paramClean } from './util';
import type { AnalyticsParams } from './validation';
import type { PricePoint } from './types';

/** @internal */
type BackendPriceTrendDTO = { timestamp?: string; price?: unknown };

/**
 * GET /api/analytics/price-trend?itemId&start&end[&supplierId]
 *
 * Fetches historical price observations for the given item. The backend returns
 * rows ordered by date ascending (ORDER BY timestamp); the client-side sort is a
 * defensive guard against malformed or unordered responses.
 * Returns an empty array when `itemId` is blank or on any error.
 * @param itemId - Required item identifier
 * @param p - Optional date window and supplier filter; defaults to last 180 days
 * @returns Chronologically sorted price points, empty on errors
 * @example
 * ```typescript
 * const points = await getPriceTrend('ITEM-123', {
 *   from: '2025-09-01',
 *   to: '2025-11-30',
 *   supplierId: 'SUP-001'
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