/**
 * @file urlState.ts
 * @module utils/urlState
 * @summary Read/write helpers for URL query params on the analytics route.
 *   Centralizes parsing and serialization so the analytics page stays declarative.
 *
 * @enterprise
 * - Sole production consumer: pages/analytics/Analytics.tsx.
 * - Backward-compatibility surface: accepts canonical `supplierId` AND legacy
 *   lowercase `supplierid` (early-version artifact); strips surrounding quotes from
 *   supplierId values that may arrive URL-encoded as %22abc%22. Both behaviors are
 *   intentional — see inline WHY comments in readParams.
 * - Pure functions: no state, no side effects, no network calls.
 * - Import direction: leaf — no app, context, or component imports.
 */

/** Plain dict of URL params (undefined = absent) */
export type UrlDict = Record<string, string | undefined>;

/**
 * Strips surrounding double quotes if present.
 * Examples:
 *  - `"abc"` → `abc`
 *  - `abc`   → `abc`
 *  - `""`    → `undefined`
 * @internal
 */
function dequote(v: string | null): string | undefined {
  if (v == null) return undefined;
  const trimmed = v.trim();
  const unquoted = trimmed.replace(/^"+|"+$/g, '');
  return unquoted.length ? unquoted : undefined;
}

/**
 * Reads a subset of keys from the given search string into a plain object.
 *
 * @param search - The raw `location.search` string (may start with `?`).
 * @param keys   - Param names to read (e.g., `['from','to','supplierId']`).
 * @returns      - A dict with the requested keys (missing → `undefined`).
 *
 * @remarks
 * - Special handling for `supplierId`: if absent, we also look for legacy
 *   lowercase `supplierid` and we strip accidental surrounding quotes.
 */
export function readParams(search: string, keys: string[]): UrlDict {
  const sp = new URLSearchParams(search);
  const out: UrlDict = {};

  for (const k of keys) {
    let raw = sp.get(k);

    // WHY: backward-compat for early-version URLs that used lowercase supplierid.
    if ((raw == null || raw === '') && k === 'supplierId') {
      raw = sp.get('supplierid');
    }

    // WHY: supplierId values may arrive URL-encoded as %22abc%22 — dequote strips the surrounding quotes.
    out[k] = k === 'supplierId' ? dequote(raw) : (raw ?? undefined);
  }

  return out;
}
