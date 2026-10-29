/**
 * @file responseExtraction.ts
 * @module api/shared/responseExtraction
 *
 * @summary
 * Response parsing for Spring Data pages: extractPageTotal reads the total of a
 * page. Consumed by the inventory and analytics API layers.
 *
 * @enterprise
 * It returns undefined rather than throwing when the body carries no total, so a
 * page without one renders without a counter instead of failing.
 */

import { pickNumber } from './fieldPickers';
import { isRecord } from './typeGuards';

/**
 * Reads the total element count of a Spring Data page. The backend writes
 * pages as Spring Data's PagedModel, which nests the total under `page`.
 *
 * @param obj - Page response body
 * @returns The total, or `undefined` when the body carries no page total
 *
 * @example
 * ```typescript
 * extractPageTotal({ content: [], page: { totalElements: 21 } }); // 21
 * ```
 */
export const extractPageTotal = (obj: unknown): number | undefined => {
  if (!isRecord(obj) || !isRecord(obj.page)) return undefined;
  return pickNumber(obj.page, 'totalElements');
};
