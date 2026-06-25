/**
 * @module api/inventory/utils/typeGuards
 *
 * Type narrowing helpers for safe type checking.
 * Re-exported through api/inventory/utils, which is consumed by
 * both the inventory and supplier API layers.
 */

/**
 * Narrows `v` to `Record<string, unknown>` when it is a non-null object.
 * Arrays also pass this check — call sites needing plain objects must
 * additionally guard with `!Array.isArray`.
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
  typeof v === 'object' && v !== null;
