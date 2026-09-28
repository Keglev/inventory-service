/**
 * @module api/shared/responseExtraction
 *
 * Response parsing utilities that unwrap common backend envelope formats.
 * resDataOrEmpty handles the Axios .data wrapper; extractArray handles Spring
 * Page responses (content key), arbitrary key envelopes (items, results), and
 * any other record shape the caller supplies key names for; extractPageTotal
 * reads the total of a Spring Data page. They return safe defaults ({} / [] /
 * undefined) rather than throwing when the expected shape is absent. Consumed
 * by the inventory, supplier and analytics API layers.
 */

import { pickNumber } from './fieldPickers';
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

/**
 * Reads the total element count of a Spring Data page. The backend's paged
 * JSON is moving from the serialised PageImpl, which carries `totalElements`
 * at the top level, to Spring Data's PagedModel, which nests it under `page`;
 * both are accepted so neither deploy order breaks a total.
 *
 * @param obj - Page response body
 * @returns The total, or `undefined` when neither shape carries a number
 *
 * @example
 * ```typescript
 * extractPageTotal({ content: [], page: { totalElements: 21 } }); // 21
 * extractPageTotal({ content: [], totalElements: 21 }); // 21
 * ```
 */
export const extractPageTotal = (obj: unknown): number | undefined => {
  if (!isRecord(obj)) return undefined;
  const page = obj.page;
  const nested = isRecord(page) ? pickNumber(page, 'totalElements') : undefined;
  return nested ?? pickNumber(obj, 'totalElements');
};
