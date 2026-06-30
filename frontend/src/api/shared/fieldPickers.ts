/**
 * @module api/shared/fieldPickers
 *
 * Field extraction helpers for records of unknown shape coming from the backend.
 * pickNumber coerces string representations of numbers; pickString requires the
 * value to already be a string — it never coerces. The *FromList variants try
 * keys in priority order to handle backend field-name variations. All functions
 * return undefined rather than throwing on missing or invalid fields.
 * Re-exported through api/inventory/utils and consumed by both the inventory
 * and supplier API layers.
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
