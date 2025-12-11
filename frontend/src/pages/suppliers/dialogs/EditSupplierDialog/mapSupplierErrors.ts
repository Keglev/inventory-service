/**
 * @file mapSupplierErrors.ts
 * @module dialogs/EditSupplierDialog/mapSupplierErrors
 *
 * @summary
 * Utility function for mapping backend supplier errors to user-friendly messages.
 * Uses heuristics to detect specific error conditions.
 *
 * @enterprise
 * - Reusable across supplier-related components
 * - Intelligent error detection with pattern matching
 * - i18n support for localized error messages
 */

import type { TFunction } from 'i18next';

/**
 * Map backend error messages to localized user-friendly messages.
 *
 * Uses pattern matching to detect specific error types:
 * - Admin-only operations (403 Forbidden)
 * - Missing creator information
 * - Duplicate email conflicts
 * - Generic fallback for unknown errors
 *
 * @param errorMsg - Error message from backend
 * @param t - i18next translation function
 * @returns Localized user-friendly error message
 *
 * @example
 * ```ts
 * const message = mapSupplierError(response.error, t);
 * setError(message);
 * ```
 */
export const mapSupplierError = (errorMsg: string | null | undefined, t: TFunction): string => {
  if (!errorMsg) {
    return t('errors:supplier.requests.failedToUpdateSupplier', 'Failed to update supplier. Please try again.');
  }

  const msg = errorMsg.toLowerCase();

  // Admin-only error (403 Forbidden)
  if (msg.includes('admin') || msg.includes('access denied') || msg.includes('403')) {
    return t('errors:supplier.adminOnly', 'Only administrators can edit supplier information.');
  }

  // Missing creator info
  if (msg.includes('createdby') || msg.includes('created by')) {
    return t('errors:supplier.validation.createdByRequired', 'Creator information is required. Please ensure you are logged in.');
  }

  // Duplicate email error (409 Conflict)
  if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('email')) {
    return t('errors:supplier.conflicts.duplicateEmail', 'This email is already in use.');
  }

  // Generic fallback
  return t('errors:supplier.requests.failedToUpdateSupplier', 'Failed to update supplier. Please try again.');
};
