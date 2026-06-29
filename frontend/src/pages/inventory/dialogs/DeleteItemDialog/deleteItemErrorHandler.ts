/**
 * @file deleteItemErrorHandler.ts
 * @module pages/inventory/dialogs/DeleteItemDialog/deleteItemErrorHandler
 *
 * @summary
 * Maps a backend error message string to a user-facing message and
 * severity. Used by useDeleteItemHandlers when deleteItem returns
 * ok: false.
 *
 * @enterprise
 * - Three rules in priority order: quantity-must-be-zero (the dominant
 *   delete failure), admin-only access, and item-not-found. A generic
 *   fallback message covers anything else.
 * - Implementation matches on substrings of the freeform backend message
 *   text ('still have', 'admin', '404', etc.). This is fragile: the
 *   locked error shape exposes a structured token via the error field
 *   (HttpStatus.name().toLowerCase()), and the backend's business-rule
 *   identifiers do not change as easily as English message text. Tracked
 *   under CB-APP48 -- switch to matching on the structured error field
 *   or on a backend-supplied rule code instead of message substrings.
 */

import type { TFunction } from 'i18next';

/**
 * Categorized error response from deleteItem API
 */
export interface DeleteErrorResult {
  /** User-facing error message */
  message: string;
  /** Error severity: warning, error, info */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Process API error response and return user-friendly message.
 *
 * Handles specific business rules:
 * - Quantity must be 0 before deletion
 * - Only admins can delete items
 * - Item not found scenarios
 *
 * @param errorText - Error text from API
 * @param t - i18n translation function
 * @returns Categorized error result with message and severity
 *
 */
export function handleDeleteError(
  errorText: string | undefined,
  t: TFunction
): DeleteErrorResult {
  if (!errorText) {
    return {
      message: t('errors:inventory.requests.failedToDeleteItem', 'Failed to delete item. Please try again.'),
      severity: 'error',
    };
  }

  // BUCKET: CB-APP48 -- substring matching on freeform backend message text is fragile. Switch to the structured error field per locked error shape.
  const lowerError = errorText.toLowerCase();

  // ============================================
  // Business Rule: Quantity must be zero
  // ============================================
  if (lowerError.includes('still have') || lowerError.includes('merchandise') || lowerError.includes('stock')) {
    return {
      message: t(
        'errors:inventory.businessRules.quantityMustBeZero',
        'You still have merchandise in stock. You need to first remove items from stock by changing quantity.'
      ),
      severity: 'error',
    };
  }

  // ============================================
  // Authorization: Admin only
  // ============================================
  if (lowerError.includes('admin') || lowerError.includes('access denied')) {
    return {
      message: t(
        'errors:inventory.businessRules.adminOnly',
        'Only administrators can delete items.'
      ),
      severity: 'warning',
    };
  }

  // ============================================
  // Not Found: Item no longer exists
  // ============================================
  if (lowerError.includes('404') || lowerError.includes('not found')) {
    return {
      message: t(
        'errors:inventory.businessRules.itemNotFound',
        'Item not found. It may have been deleted by another user.'
      ),
      severity: 'warning',
    };
  }

  // ============================================
  // Generic error fallback
  // ============================================
  return {
    message: t('errors:inventory.requests.failedToDeleteItem', 'Failed to delete item. Please try again.'),
    severity: 'error',
  };
}
