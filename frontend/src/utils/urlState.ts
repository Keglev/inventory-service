/**
 * @file urlState.ts
 * @description
 * Tiny helpers to read/write query params for the analytics filters.
 *
 * @enterprise
 * - Centralizes URL parsing/serialization so pages/components stay dumb.
 * - Backward-compatible: accepts both `supplierId` (canonical) and `supplierid`.
 * - Defensive: strips accidental surrounding quotes (e.g., `%22abc%22` → `abc`).
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

    // Backward compatibility + robustness for supplierId
    if ((raw == null || raw === '') && k === 'supplierId') {
      raw = sp.get('supplierid');
    }

    // Strip accidental quotes for IDs (especially supplierId)
    out[k] = k === 'supplierId' ? dequote(raw) : (raw ?? undefined);
  }

  return out;
}

/**
 * Serializes a patch of params back into a search string.
 *
 * @param baseSearch - The existing `location.search` (preserved unless overwritten).
 * @param patch      - Key/value pairs to upsert (undefined/empty → removed).
 * @returns          - A `?key=value&...` string, or empty string when no params.
 *
 * @example
 * writeParams('?from=2025-01-01', { supplierId: 'abc', to: '2025-02-01' })
 * // → '?from=2025-01-01&supplierId=abc&to=2025-02-01'
 */
export function writeParams(baseSearch: string, patch: UrlDict): string {
  const sp = new URLSearchParams(baseSearch);

  Object.entries(patch).forEach(([k, v]) => {
    const val = v?.trim?.() ?? v;
    if (val === undefined || val === null || val === '') sp.delete(k);
    else sp.set(k, val);
  });

  const s = sp.toString();
  return s ? `?${s}` : '';
}
