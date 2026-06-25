/**
 * @module api/analytics/util
 *
 * Low-level helpers for the analytics API layer: defensive numeric coercion,
 * tolerant backend-response parsing, and filter-parameter normalisation for
 * /api/analytics endpoints. Re-exported from the analytics barrel (index.ts).
 */
import type { AnalyticsParams } from './validation';
import type { ItemRef } from './types';
import { getTodayIso, getDaysAgoIso } from '../../utils/formatters';

/** Guards numeric fields from the backend against NaN, Infinity, and non-numeric strings so callers never silently accumulate bad values. */
export function asNumber(v: unknown): number {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v === 'string' && v.trim() !== '') {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

/** Named record alias so all narrowing helpers share a single consistent type target. */
export type Rec = Record<string, unknown>;

/** Narrows `unknown` to a plain record; explicitly excludes null and arrays, which `typeof` also reports as `'object'`. */
export function isRecord(x: unknown): x is Rec {
    return !!x && typeof x === 'object' && !Array.isArray(x);
}

/** Narrows `unknown` to a homogeneous array of plain records; useful before mapping list-endpoint responses to domain types. */
export function isArrayOfRecords(x: unknown): x is Rec[] {
    return Array.isArray(x) && x.every(isRecord);
}

/** Tries a fallback key list so callers tolerate backend field renames without branching; returns `''` when no key resolves. */
export function pickString(r: Rec, keys: string[]): string {
    for (const k of keys) {
        const v = r[k];
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return String(v);
    }
    return '';
}

/** Same contract as pickString but returns a coerced number; prevents NaN from reaching callers when a numeric key is missing. */
export function pickNumber(r: Rec, keys: string[]): number {
    for (const k of keys) {
        if (k in r) return asNumber(r[k]);
    }
    return 0;
}

/** Absorbs field-name variations (`id`/`itemId`, `name`/`itemName`) across backend endpoints so callers always receive a uniform ItemRef[]. */
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

/** Safety net for when the backend ignores the search query param; filters and caps results client-side. Returns the first `limit` items when `q` is blank. */
export function clientFilter(items: ItemRef[], q: string, limit: number): ItemRef[] {
    const needle = q.trim().toLowerCase();
    if (!needle) return items.slice(0, limit);
    return items.filter((it) => it.name.toLowerCase().includes(needle)).slice(0, limit);
}

/**
 * Maps UI filter state to the query-string shape the backend expects:
 * `start`/`end` as LocalDate strings, optional `supplierId`.
 * Defaults to the last 180 days when the caller omits date bounds.
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
