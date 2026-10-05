/**
 * @module api/shared/fieldPickers
 *
 * Field extraction helpers for records of unknown shape coming from the backend.
 * pickNumber coerces string representations of numbers; pickString requires the
 * value to already be a string — it never coerces. Both read one key, the name
 * the backend DTO uses, and return undefined rather than throwing on missing or
 * invalid fields. Consumed by the inventory, supplier and shared API layers.
 */

/**
 * Returns the value at key `k` only when it is already a string; returns
 * undefined for numbers, booleans, and all other types. Avoids implicit
 * coercions that could silently produce unexpected data.
 *
 * @param r - Record to extract from
 * @param k - Key to look up
 * @returns String value if present, undefined otherwise
 *
 * @example
 * ```typescript
 * const name = pickString(obj, 'name'); // returns string or undefined
 * ```
 */
export const pickString = (r: Record<string, unknown>, k: string): string | undefined => {
  const v = r[k];
  return typeof v === 'string' ? v : undefined;
};

/**
 * Extract finite number from record, handling string-to-number coercion.
 * Ignores NaN, Infinity, and non-numeric strings.
 *
 * @param r - Record to extract from
 * @param k - Key to look up
 * @returns Finite number if found, undefined otherwise
 *
 * @example
 * ```typescript
 * const quantity = pickNumber(obj, 'qty'); // returns number or undefined
 * ```
 */
export const pickNumber = (r: Record<string, unknown>, k: string): number | undefined => {
  const v = r[k];
  if (typeof v === 'number') {
    return Number.isFinite(v) ? v : undefined;
  }
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};
