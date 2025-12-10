/**
 * @file errorHandling.ts
 * @module api/inventory/utils/errorHandling
 *
 * @summary
 * Error extraction and user-friendly message handling.
 * Converts API errors into meaningful messages for UI display.
 *
 * @enterprise
 * - Extracts structured error info from Axios responses
 * - HTTP status-specific fallback messages
 * - User-friendly error messages (no technical jargon)
 * - Consistent error handling across all mutations
 */

import { isRecord } from './typeGuards';
import { pickString, pickNumber } from './fieldPickers';

/**
 * Extract user-friendly error message from network response or exception.
 * Handles Axios-like error shapes with structured response.data.
 * Provides HTTP status-specific fallback messages.
 *
 * @param e - Error from network call (Axios error or generic Error)
 * @returns User-friendly error message for UI display
 *
 * @example
 * ```typescript
 * try {
 *   await http.post('/api/items', data);
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
