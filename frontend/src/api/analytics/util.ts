/**
* @file util.ts
* @module api/analytics/util
*
* @summary
* Internal helpers for safe coercions, param normalization, and tolerant parsing.
* These utilities are internal to the API layer and are not exported to UI code directly.
* @enterprise
* - Defensive type coercion for robust data handling
* - Tolerant parsing of backend responses to prevent UI breakage
* - Parameter normalization for consistent API requests
* - TypeDoc documentation for utility functions
*/
import type { AnalyticsParams } from './validation';
import type { ItemRef } from './types';
import { getTodayIso, getDaysAgoIso } from '../../utils/formatters';

/** Defensive number coercion (NaN → 0). 
 * Handles numbers and numeric strings; returns 0 for others.
 * Useful for parsing backend data with uncertain types.
 * Examples:
 * - asNumber(42) → 42
 * - asNumber("3.14") → 3.14
 * - asNumber("foo") → 0
 * - asNumber(null) → 0
 * - asNumber(undefined) → 0
 * - asNumber([]) → 0
 * - asNumber({}) → 0
 * 
*/
export function asNumber(v: unknown): number {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

/** Narrow unknown to record. 
 * Returns false for null/arrays.
 * Use isArrayOfRecords to check for arrays of records.
*/
export type Rec = Record<string, unknown>;
export function isRecord(x: unknown): x is Rec {
    return !!x && typeof x === 'object' && !Array.isArray(x);
}
export function isArrayOfRecords(x: unknown): x is Rec[] {
    return Array.isArray(x) && x.every(isRecord);
}

/** Try multiple keys; return first string/number encountered as string. 
 * Returns empty string if none found.
*/
export function pickString(r: Rec, keys: string[]): string {
    for (const k of keys) {
        const v = r[k];
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
    }
    return '';
}

/** Try multiple keys; return first numeric-like value. 
 * Returns 0 if none found or non-numeric.
*/
export function pickNumber(r: Rec, keys: string[]): number {
    for (const k of keys) {
        if (k in r) return asNumber(r[k]);
    }
    return 0;
}

/** Normalize backend rows into `{ id, name }[]` safely. 
 * Filters out invalid entries.
 * Accepts either `id` or `itemId` for the identifier,
 * and `name` or `itemName` for the display name.
 * Optionally includes `supplierId` if present.
*/
export function normalizeItemsList(data: unknown): ItemRef[] {
    if (!Array.isArray(data)) return [];
    return (data as Array<{ id?: string | number; itemId?: string | number; name?: string; itemName?: string; supplierId?: string | number | null }>)
    .map((d) => ({
        id: String(d.id ?? d.itemId ?? ''),
        name: String(d.name ?? d.itemName ?? ''),
        supplierId: typeof d.supplierId === 'string' || typeof d.supplierId === 'number' ? String(d.supplierId) : undefined,
    }))
    .filter((it) => it.id && it.name);
}

/** Client-side filter as a safety net if the BE ignores search params. 
 * Returns at most `limit` items whose names include `q` (case-insensitive).
 * If `q` is empty/whitespace, returns the first `limit` items.
*/
export function clientFilter(items: ItemRef[], q: string, limit: number): ItemRef[] {
    const needle = q.trim().toLowerCase();
    if (!needle) return items.slice(0, limit);
    return items.filter((it) => it.name.toLowerCase().includes(needle)).slice(0, limit);
}

/**
 * Normalize FE filter parameters to BE query params.
 * BE expects `start` / `end` (LocalDate), optional `supplierId`.
 * If the caller omits dates, default to the last 180 days.
*/
export function paramClean(p?: AnalyticsParams): Record<string, string> {
    const out: Record<string, string> = {};
    const from = p?.from ?? getDaysAgoIso(180);
    const to = p?.to ?? getTodayIso();
    out.start = from;
    out.end = to;
    if (p?.supplierId) out.supplierId = p.supplierId;
    return out;
}