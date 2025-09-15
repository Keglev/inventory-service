/**
 * @file urlState.ts
 * @description Tiny helpers to read/write query params for the analytics filters.
 *
 * @enterprise
 * - Avoids scattering URL parsing logic around pages.
 */

export type UrlDict = Record<string, string | undefined>;

/** Reads a subset of keys from URLSearchParams into a plain object (undefined for missing). */
export function readParams(search: string, keys: string[]): UrlDict {
  const sp = new URLSearchParams(search);
  const out: UrlDict = {};
  for (const k of keys) {
    const v = sp.get(k);
    out[k] = v ?? undefined;
  }
  return out;
}

/** Writes an object back into a search string, dropping falsy/empty values. */
export function writeParams(baseSearch: string, patch: UrlDict): string {
  const sp = new URLSearchParams(baseSearch);
  Object.entries(patch).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') sp.delete(k);
    else sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}
