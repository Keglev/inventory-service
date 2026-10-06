/**
 * @file searchFragment.ts
 * @module utils/searchFragment
 *
 * @summary
 * The one rule for when a typed search starts matching, shared by the
 * supplier and item searches that run in the browser (frontend ADR-0014).
 *
 * @enterprise
 * - Same rule as the backend searches: trimmed, case-insensitive, at least
 *   SEARCH_MIN_CHARS characters.
 */

/** Characters a search needs before it lists any result. */
export const SEARCH_MIN_CHARS = 2;

/** The trimmed, lower-cased query, or null while it is shorter than SEARCH_MIN_CHARS. */
export function searchFragment(query: string): string | null {
  const fragment = query.trim().toLowerCase();
  return fragment.length >= SEARCH_MIN_CHARS ? fragment : null;
}
