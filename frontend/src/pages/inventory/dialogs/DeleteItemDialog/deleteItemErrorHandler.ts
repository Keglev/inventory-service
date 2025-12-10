/**
 * @file deleteItemErrorHandler.ts
 * @description
 * Error handling logic for delete item operations.
 * Maps backend errors to user-friendly messages.
 * Separated from hook to keep logic testable and reusable.
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
 * @example
 * ```ts
 * const error = handleDeleteError('You still have merchandise', t);
 * // Returns: { message: '...translated message...', severity: 'error' }
 * ```
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
