/**
* @file util.ts
* @module api/analytics/util
*
* @summary
* Internal helpers for safe coercions, param normalization, and tolerant parsing.
* These utilities are internal to the API layer and are not exported to UI code directly.
*/
import type { AnalyticsParams, ItemRef } from './types';
import { getTodayIso, getDaysAgoIso } from '../../utils/formatters';

/** Defensive number coercion (NaN → 0). */
export function asNumber(v: unknown): number {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

/** Narrow unknown to record. */
export type Rec = Record<string, unknown>;
export function isRecord(x: unknown): x is Rec {
    return !!x && typeof x === 'object' && !Array.isArray(x);
}
export function isArrayOfRecords(x: unknown): x is Rec[] {
    return Array.isArray(x) && x.every(isRecord);
}

/** Try multiple keys; return first string/number encountered as string. */
export function pickString(r: Rec, keys: string[]): string {
    for (const k of keys) {
        const v = r[k];
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
    }
    return '';
}

/** Try multiple keys; return first numeric-like value. */
export function pickNumber(r: Rec, keys: string[]): number {
    for (const k of keys) {
        if (k in r) return asNumber(r[k]);
    }
    return 0;
}

/** Normalize backend rows into `{ id, name }[]` safely. */
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

/** Client-side filter as a safety net if the BE ignores search params. */
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