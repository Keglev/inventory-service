/**
 * @file typeGuards.ts
 * @module api/shared/typeGuards
 *
 * @summary
 * Type narrowing helpers for values of unknown shape.
 *
 * @enterprise
 * Consumed by both the inventory and supplier API layers, so both narrow backend
 * data by the same checks.
 */

/**
 * Narrows `v` to `Record<string, unknown>` when it is a non-null object.
 * Arrays do NOT pass this check; the guard is safe to use directly when
 * the caller needs a plain object.
 *
 * @param v - Value to test
 * @returns `true` when `typeof v === 'object'` and `v !== null`
 *
 * @example
 * ```typescript
 * if (isRecord(data)) {
 *   console.log(data.name); // TypeScript knows data is a Record
 * }
 * ```
 */
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
