/**
 * @module api/shared/responseExtraction
 *
 * Response parsing utilities that unwrap common backend envelope formats.
 * resDataOrEmpty handles the Axios .data wrapper; extractArray handles Spring
 * Page responses (content key), arbitrary key envelopes (items, results), and
 * any other record shape the caller supplies key names for. Both functions
 * return safe defaults ({} / []) rather than throwing when the expected shape
 * is absent. Consumed by both the
 * inventory and supplier API layers.
 */

import { isRecord } from './typeGuards';

/**
 * Safely unwraps the .data property that Axios attaches to every response;
 * returns an empty object when the property is absent so callers can
 * destructure or pass the result to extractArray without null-guarding.
 *
 * @param resp - Value to unwrap (typically an Axios response)
 * @returns `resp.data` if present, `{}` otherwise
 *
 * @example
 * ```typescript
 * const data = resDataOrEmpty(response); // Safe access to response.data
 * ```
 */
export const resDataOrEmpty = (resp: unknown): unknown => {
  if (isRecord(resp) && 'data' in resp) {
    const r = resp as Record<string, unknown>;
    return r.data ?? {};
  }
  return {};
};

/**
 * Tries each key in order and returns the first array-valued property found.
 * Needed because different backends use different envelope field names for list
 * payloads (e.g. Spring Page uses `content`); the caller supplies the priority
 * order so the same logic handles multiple endpoints without branching.
 *
 * @param obj - Response record to search
 * @param keys - Keys to try in priority order (e.g., `['items', 'content', 'data']`)
 * @returns First array found, or `[]` if no key holds an array
 *
 * @example
 * ```typescript
 * const items = extractArray(response, ['items', 'content']);
 * ```
 */
export const extractArray = (obj: unknown, keys: string[]): unknown[] => {
  if (!isRecord(obj)) return [];
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v as unknown[];
  }
  return [];
};
