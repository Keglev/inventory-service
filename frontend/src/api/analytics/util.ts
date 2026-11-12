/**
 * @file util.ts
 * @module api/analytics/util
 *
 * @summary
 * Low-level helpers for the analytics API layer: defensive numeric coercion,
 * tolerant backend-response parsing, and filter-parameter normalisation for
 * /api/analytics endpoints.
 *
 * @enterprise
 * - firstStringOrEmpty / firstNumberOrZero read one key and return a default
 *   (''/0) on a miss, so chart rows never hold undefined; pickString /
 *   pickNumber in api/shared/fieldPickers return undefined instead and leave
 *   the default to the caller. The contracts differ (number-to-string
 *   coercion, numeric strings read as numbers): do not consolidate.
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

/** Returns the key's value when it is a string (a number is stringified), otherwise `''`. */
export function firstStringOrEmpty(r: Rec, key: string): string {
    const v = r[key];
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    return '';
}

/** Returns the key's value coerced to a number, or 0 when the key is absent, so NaN never reaches callers. */
export function firstNumberOrZero(r: Rec, key: string): number {
    return key in r ? asNumber(r[key]) : 0;
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
