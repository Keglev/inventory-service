/**
 * @file typeGuards.ts
 * @module api/inventory/utils/typeGuards
 *
 * @summary
 * Type narrowing helpers for safe type checking.
 * Single source of truth for all type guards used across inventory operations.
 *
 * @enterprise
 * - Strict TypeScript without any
 * - Reusable across all inventory modules
 * - Clear, single-purpose functions
 */

/**
 * Type narrowing helper: safely check if a value is a plain object record.
 *
 * @param v - Value to check
 * @returns True if v is a non-null object (record)
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
