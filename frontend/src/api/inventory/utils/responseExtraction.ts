/**
 * @file responseExtraction.ts
 * @module api/inventory/utils/responseExtraction
 *
 * @summary
 * Response parsing utilities for extracting data from various envelope formats.
 * Handles plain arrays, Spring Page envelopes, and custom response shapes.
 *
 * @enterprise
 * - Tolerant of multiple response envelope formats
 * - Single source of truth for response parsing
 * - Clear separation of parsing logic
 * - Defensive programming: returns sensible defaults
 */

import { isRecord } from './typeGuards';

/**
 * Extract response.data safely, or return an empty object.
 * Handles both Axios responses and raw data objects.
 *
 * @param resp - Response object from http call
 * @returns Response data or empty object if not found
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
 * From an unknown response object, try to pull an array from one of the keys.
 * Useful for extracting arrays from envelope formats like { items: [...] } or { content: [...] }.
 * Falls back to [] if nothing sane is found.
 *
 * @param obj - Response object to extract array from
 * @param keys - Keys to try in order (e.g., ['items', 'content', 'data'])
 * @returns Array if found in one of the keys, empty array otherwise
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
