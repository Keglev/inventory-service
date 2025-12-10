/**
 * @file fieldPickers.ts
 * @module api/inventory/utils/fieldPickers
 *
 * @summary
 * Field extraction helpers for flexible backend field name handling.
 * Handles string and number coercion with safe fallbacks.
 *
 * @enterprise
 * - Tolerant of backend field name variations
 * - Handles type coercion safely
 * - Clear, composable extraction functions
 * - No throwing: returns undefined for missing fields
 */

/**
 * Extract string value from record, checking a specific key.
 * Handles both string and number coercion.
 *
 * @param r - Record to extract from
 * @param k - Key to look up
 * @returns String value if found, undefined otherwise
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
 * Extract finite number from record, handling string coercion.
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

/**
 * Try a list of keys and return the first numeric value found.
 * Useful for handling multiple possible field names from backend.
 *
 * @param r - Record to extract from
 * @param keys - Keys to try in order
 * @returns First finite number found, undefined if none match
 *
 * @example
 * ```typescript
 * const qty = pickNumberFromList(obj, ['quantity', 'qty', 'onHand']);
 * ```
 */
export const pickNumberFromList = (r: Record<string, unknown>, keys: string[]): number | undefined => {
  for (const key of keys) {
    const val = pickNumber(r, key);
    if (val !== undefined) return val;
  }
  return undefined;
};

/**
 * Try a list of keys and return the first string value found.
 * Useful for handling multiple possible field names from backend.
 *
 * @param r - Record to extract from
 * @param keys - Keys to try in order
 * @returns First string found, undefined if none match
 *
 * @example
 * ```typescript
 * const name = pickStringFromList(obj, ['name', 'itemName', 'title']);
 * ```
 */
export const pickStringFromList = (r: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const val = pickString(r, key);
    if (val !== undefined) return val;
  }
  return undefined;
};
