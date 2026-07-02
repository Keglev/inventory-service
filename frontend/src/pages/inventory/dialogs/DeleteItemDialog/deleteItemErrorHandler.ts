/**
 * @file deleteItemErrorHandler.ts
 * @module pages/inventory/dialogs/DeleteItemDialog/deleteItemErrorHandler
 *
 * @summary
 * Maps a failed delete response to a user-facing message and severity.
 * Used by useDeleteItemHandlers when deleteItem returns ok: false.
 *
 * @enterprise
 * - Branches on the backend's structured status token (errorToken =
 *   HttpStatus.name().toLowerCase()) rather than on substrings of the freeform
 *   message. The three delete failure categories map to distinct tokens:
 *   remaining stock -> 'conflict' (the backend guards deletion at quantity 0),
 *   insufficient permission -> 'forbidden', and a vanished item -> 'not_found'.
 *   Anything else (including a network failure with no response) falls through
 *   to a generic message.
 * - Message text is sourced from i18n keys. The TFunction param is typed over the
 *   app namespaces (including 'errors'), so 'errors:' keys type-check single-arg;
 *   the resource bundle value is authoritative at runtime.
 */

import type { TFunction } from 'i18next';

/**
 * Minimal shape consumed from a failed mutation response.
 */
export interface DeleteErrorInput {
  /** Normalized backend status token (e.g. 'not_found', 'conflict', 'forbidden'). */
  errorToken?: string | null;
}

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
 * Process a failed delete response and return a user-friendly message.
 *
 * Handles the specific business rules the backend enforces:
 * - Quantity must be 0 before deletion ('conflict')
 * - Only admins can delete items ('forbidden')
 * - Item no longer exists ('not_found')
 *
 * @param result - Failed mutation response (or undefined)
 * @param t - i18n translation function
 * @returns Categorized error result with message and severity
 */
export function handleDeleteError(
  result: DeleteErrorInput | undefined,
  t: TFunction<['common', 'inventory', 'errors']>
): DeleteErrorResult {
  const token = result?.errorToken ?? null;

  // Business rule: item still has stock (deletion is only allowed at quantity 0).
  if (token === 'conflict') {
    return {
      message: t('errors:inventory.businessRules.quantityMustBeZero'),
      severity: 'error',
    };
  }

  // Authorization: only administrators may delete items.
  if (token === 'forbidden') {
    return {
      message: t('errors:inventory.businessRules.adminOnly'),
      severity: 'warning',
    };
  }

  // Not found: the item no longer exists.
  if (token === 'not_found') {
    return {
      message: t('errors:inventory.businessRules.itemNotFound'),
      severity: 'warning',
    };
  }

  // Generic fallback (network failure or an unmapped status).
  return {
    message: t('errors:inventory.requests.failedToDeleteItem'),
    severity: 'error',
  };
}
