/**
 * @module api/analytics/util
 *
 * Low-level helpers for the analytics API layer: defensive numeric coercion,
 * tolerant backend-response parsing, and filter-parameter normalisation for
 * /api/analytics endpoints. Re-exported from the analytics barrel (index.ts).
 *
 * @enterprise
 * - pickString/pickNumber here are a multi-key, default-returning family (try a
 *   list of keys, return ''/0 on miss), distinct by design from the single-key,
 *   undefined-returning pickString/pickNumber in @/api/shared. The two families
 *   are partitioned by directory and never imported into the same module, so the
 *   shared name carries no collision risk. Kept separate intentionally
 * -- do not consolidate; the contracts differ.
 */
import type { AnalyticsParams } from './validation';
import { getTodayIso, getDaysAgoIso } from '../../utils/formatters';
import { isRecord } from '../shared/typeGuards';

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
