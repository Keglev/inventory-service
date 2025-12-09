/**
 * @file utils.ts
 * @module api/inventory/utils
 *
 * @summary
 * Centralized type narrowing and error handling utilities for inventory API layer.
 * Eliminates duplicate helper functions across mutations.ts and list.ts.
 *
 * @enterprise
 * - Single source of truth for all type guards
 * - Consistent error extraction logic across all inventory operations
 * - No any: all functions use strict type narrowing
 */

/**
 * Type narrowing helper: safely check if a value is a plain object record.
 * @param v - Value to check
 * @returns True if v is a non-null object (record)
 */
export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

/**
 * Extract string value from record, checking multiple possible keys.
 * Handles both string and number coercion.
 * @param r - Record to extract from
 * @param k - Key to look up
 * @returns String value if found, undefined otherwise
 */
export const pickString = (r: Record<string, unknown>, k: string): string | undefined => {
  const v = r[k];
  return typeof v === 'string' ? v : undefined;
};

/**
 * Extract finite number from record, handling string coercion.
 * Ignores NaN, Infinity, and non-numeric strings.
 * @param r - Record to extract from
 * @param k - Key to look up
 * @returns Finite number if found, undefined otherwise
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
 * Useful for field name variations from backend.
 * @param r - Record to extract from
 * @param keys - Keys to try in order
 * @returns First finite number found, undefined if none match
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
 * Useful for field name variations from backend.
 * @param r - Record to extract from
 * @param keys - Keys to try in order
 * @returns First string found, undefined if none match
 */
export const pickStringFromList = (r: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const val = pickString(r, key);
    if (val !== undefined) return val;
  }
  return undefined;
};

/**
 * Extract user-friendly error message from network response or exception.
 * Handles Axios-like error shapes with structured response.data.
 * Provides HTTP status-specific fallback messages.
 * @param e - Error from network call (Axios error or generic Error)
 * @returns User-friendly error message
 */
export const errorMessage = (e: unknown): string => {
  // Axios-like error shape with response.data.{message|error}
  if (isRecord(e) && isRecord(e.response)) {
    const resp = e.response as Record<string, unknown>;
    const status = pickNumber(resp, 'status');

    if (isRecord(resp.data)) {
      const d = resp.data as Record<string, unknown>;
      const msg = pickString(d, 'message') ?? pickString(d, 'error');
      if (msg) return msg;
    }

    // Fallback to HTTP status message if available
    if (status === 403) return 'Access denied - Admin permission required';
    if (status === 401) return 'Not authenticated - Please log in';
    if (status === 404) return 'Item not found';
    if (status === 409) return 'Conflict - Name already exists';
    if (status === 400) return 'Invalid input';
  }
  if (e instanceof Error) return e.message;
  return 'Request failed';
};

/**
 * Extract response.data safely, or return an empty object.
 * @param resp - Response object from http call
 * @returns Response data or empty object if not found
 */
export const resDataOrEmpty = (resp: unknown): unknown => {
  if (isRecord(resp) && 'data' in resp) {
    const r = resp as Record<string, unknown>;
    return r.data ?? {};
  }
  return {};
};

/**
 * From an unknown response object, try to pull an array out of one of the keys.
 * Falls back to [] if nothing sane is found.
 * @param obj - Response object to extract array from
 * @param keys - Keys to try in order
 * @returns Array if found in one of the keys, empty array otherwise
 */
export const extractArray = (obj: unknown, keys: string[]): unknown[] => {
  if (!isRecord(obj)) return [];
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v as unknown[];
  }
  return [];
};
