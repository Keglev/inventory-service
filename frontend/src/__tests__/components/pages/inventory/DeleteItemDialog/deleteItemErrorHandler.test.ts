/**
 * @file deleteItemErrorHandler.test.ts
 * @module __tests__/components/pages/inventory/DeleteItemDialog/deleteItemErrorHandler
 * @description Unit tests for handleDeleteError utility.
 *
 * Contract under test:
 * - Maps the backend's structured status token into a user-friendly message + severity.
 * - Requests i18n keys with a defaultValue (required by the typed TFunction for
 *   cross-namespace 'errors:' keys).
 */

import { describe, it, expect, vi } from 'vitest';
import type { TFunction } from 'i18next';

import { handleDeleteError } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/deleteItemErrorHandler';

// -------------------------------------
// Helpers
// -------------------------------------

type TSpy = ReturnType<typeof vi.fn<[key: string, fallback?: string], string>>;

/**
 * Translation stub: returns the defaultValue when provided, otherwise the key.
 */
function createT(): { t: TFunction; spy: TSpy } {
  const spy: TSpy = vi.fn((key: string, fallback?: string) => fallback ?? key);
  return { t: spy as unknown as TFunction, spy };
}

describe('handleDeleteError', () => {
  it('returns a generic message when no token is present', () => {
    const { t, spy } = createT();

    const result = handleDeleteError(undefined, t);

    expect(result).toEqual({
      message: 'Failed to delete item. Please try again.',
      severity: 'error',
    });
    expect(spy).toHaveBeenCalledWith(
      'errors:inventory.requests.failedToDeleteItem',
      'Failed to delete item. Please try again.'
    );
  });

  it('maps the conflict token to the quantity rule with error severity', () => {
    const { t, spy } = createT();

    const result = handleDeleteError({ errorToken: 'conflict' }, t);

    expect(result).toEqual({
      message:
        'You still have merchandise in stock. You need to first remove items from stock by changing quantity.',
      severity: 'error',
    });
    expect(spy).toHaveBeenCalledWith(
      'errors:inventory.businessRules.quantityMustBeZero',
      'You still have merchandise in stock. You need to first remove items from stock by changing quantity.'
    );
  });

  it('maps the forbidden token to admin-only with warning severity', () => {
    const { t, spy } = createT();

    const result = handleDeleteError({ errorToken: 'forbidden' }, t);

    expect(result).toEqual({
      message: 'Only administrators can delete items.',
      severity: 'warning',
    });
    expect(spy).toHaveBeenCalledWith(
      'errors:inventory.businessRules.adminOnly',
      'Only administrators can delete items.'
    );
  });

  it('maps the not_found token to item-not-found with warning severity', () => {
    const { t, spy } = createT();

    const result = handleDeleteError({ errorToken: 'not_found' }, t);

    expect(result).toEqual({
      message: 'Item not found. It may have been deleted by another user.',
      severity: 'warning',
    });
    expect(spy).toHaveBeenCalledWith(
      'errors:inventory.businessRules.itemNotFound',
      'Item not found. It may have been deleted by another user.'
    );
  });

  it('falls back to the generic message for an unmapped token', () => {
    const { t } = createT();

    const result = handleDeleteError({ errorToken: 'internal_server_error' }, t);

    expect(result).toEqual({
      message: 'Failed to delete item. Please try again.',
      severity: 'error',
    });
  });

  it('falls back to the generic message when errorToken is null', () => {
    const { t } = createT();

    const result = handleDeleteError({ errorToken: null }, t);

    expect(result).toEqual({
      message: 'Failed to delete item. Please try again.',
      severity: 'error',
    });
  });
});
