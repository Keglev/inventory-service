/**
 * @module api/shared/errorHandling
 *
 * Shared error extraction utilities used by both the inventory and supplier API layers.
 * Converts Axios error shapes into user-friendly strings for UI display, with
 * HTTP status-specific fallback messages when the backend sends no body message.
 */

import { isRecord } from './typeGuards';
import { pickString, pickNumber } from './fieldPickers';

/**
 * Extracts a user-friendly error message from a network error.
 *
 * Used by both `itemMutations` (inventory) and `supplierMutations` to normalize
 * Axios error shapes into strings the UI can display directly.
 * Prefers `response.data.message` or `response.data.error` from the backend;
 * falls back to status-specific strings when no body message is present.
 *
 * @param e - Error from a network call (Axios error or generic `Error`)
 * @returns User-friendly error message string
 *
 * @example
 * ```typescript
 * try {
 *   await http.post('/api/suppliers', data);
 * } catch (error) {
 *   const msg = errorMessage(error); // "Access denied - Admin permission required"
 * }
 * ```
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

    // HTTP status-specific fallbacks when backend sends no body message
    if (status === 403) return 'Access denied - Admin permission required';
    if (status === 401) return 'Not authenticated - Please log in';
    if (status === 404) return 'Not found';
    if (status === 409) return 'Conflict - Name already exists';
    if (status === 400) return 'Invalid input';
  }
  if (e instanceof Error) return e.message;
  return 'Request failed';
};

/**
 * Structured view of a backend error, extracted from an Axios error shape.
 *
 * Where `errorMessage` collapses an error to a single display string, this
 * preserves the machine-readable pieces callers need for reliable branching:
 * the normalized status token the backend places in the `error` field
 * (HttpStatus.name().toLowerCase(), e.g. `not_found`, `conflict`) and the numeric
 * HTTP status. Consumers should branch on `token`, never on substrings of the
 * freeform `message`.
 */
export interface ApiErrorInfo {
  /** Normalized backend status token (e.g. 'not_found', 'conflict'); null when absent. */
  token: string | null;
  /** Numeric HTTP status; null when the error is not an Axios response error. */
  status: number | null;
  /** Best available human-readable message. */
  message: string;
  /**
   * Per-field error map from the backend envelope (field name to message);
   * null when the response carries no fieldErrors object.
   */
  fieldErrors: Record<string, string> | null;
}

/**
 * Extracts the structured token, status, and message from a network error.
 *
 * Complements `errorMessage` (which returns only a display string). Prefers the
 * backend body's `error` token and `message`; falls back to the numeric status
 * and the native Error message. Never throws.
 *
 * @param e - Error from a network call (Axios error or generic `Error`)
 * @returns Structured error info for token-based branching
 */
export const extractApiError = (e: unknown): ApiErrorInfo => {
  if (isRecord(e) && isRecord(e.response)) {
    const resp = e.response as Record<string, unknown>;
    const status = pickNumber(resp, 'status');
    let token: string | null = null;
    let message: string | null = null;
    let fieldErrors: Record<string, string> | null = null;
    if (isRecord(resp.data)) {
      const d = resp.data as Record<string, unknown>;
      token = pickString(d, 'error') ?? null;
      message = pickString(d, 'message') ?? pickString(d, 'error') ?? null;
      if (isRecord(d.fieldErrors)) {
        const entries = Object.entries(d.fieldErrors).filter(
          (pair): pair is [string, string] => typeof pair[1] === 'string'
        );
        if (entries.length > 0) fieldErrors = Object.fromEntries(entries);
      }
    }
    return {
      token,
      status: status ?? null,
      message: message ?? 'Request failed',
      fieldErrors,
    };
  }
  if (e instanceof Error) return { token: null, status: null, message: e.message, fieldErrors: null };
  return { token: null, status: null, message: 'Request failed', fieldErrors: null };
};
