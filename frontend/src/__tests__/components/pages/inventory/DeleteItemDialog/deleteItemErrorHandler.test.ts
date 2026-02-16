/**
 * @file deleteItemErrorHandler.test.ts
 * @module __tests__/components/pages/inventory/DeleteItemDialog/deleteItemErrorHandler
 * @description Unit tests for handleDeleteError utility.
 *
 * Contract under test:
 * - Maps backend/API error text into a user-friendly message + severity.
 * - Uses i18n keys with fallback strings (so UI remains usable even if translations are missing).
 */

import { describe, it, expect, vi } from 'vitest';
import type { TFunction } from 'i18next';

import { handleDeleteError } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/deleteItemErrorHandler';

// -------------------------------------
// Helpers
// -------------------------------------

type TSpy = ReturnType<typeof vi.fn<[key: string, fallback?: string], string>>;

/**
 * Translation stub:
 * - returns fallback when provided
 * - otherwise returns the key
 */
function createT(): { t: TFunction; spy: TSpy } {
  const spy: TSpy = vi.fn((key: string, fallback?: string) => fallback ?? key);
  return { t: spy as unknown as TFunction, spy };
}

describe('handleDeleteError', () => {
  it('returns a generic message when error text is missing', () => {
    const { t, spy } = createT();

    const result = handleDeleteError(undefined, t);

    expect(result).toEqual({
      message: 'Failed to delete item. Please try again.',
      severity: 'error',
    });

    expect(spy).toHaveBeenCalledWith(
      'errors:inventory.requests.failedToDeleteItem',
      'Failed to delete item. Please try again.',
    );
  });

  it('maps quantity rule violation to error severity', () => {
    const { t, spy } = createT();

    const result = handleDeleteError('You still have merchandise in stock', t);

    expect(result).toEqual({
      message:
        'You still have merchandise in stock. You need to first remove items from stock by changing quantity.',
      severity: 'error',
    });

    expect(spy).toHaveBeenCalledWith(
      'errors:inventory.businessRules.quantityMustBeZero',
      'You still have merchandise in stock. You need to first remove items from stock by changing quantity.',
    );
  });

  it('maps admin permission failure to warning severity', () => {
    const { t, spy } = createT();

    const result = handleDeleteError('Access denied: admin required', t);

    expect(result).toEqual({
      message: 'Only administrators can delete items.',
      severity: 'warning',
    });

    expect(spy).toHaveBeenCalledWith(
      'errors:inventory.businessRules.adminOnly',
      'Only administrators can delete items.',
    );
  });

  it('maps not found errors to warning severity with explanation', () => {
    const { t, spy } = createT();

    const result = handleDeleteError('404 Not Found', t);

    expect(result).toEqual({
      message: 'Item not found. It may have been deleted by another user.',
      severity: 'warning',
    });

    expect(spy).toHaveBeenCalledWith(
      'errors:inventory.businessRules.itemNotFound',
      'Item not found. It may have been deleted by another user.',
    );
  });

  it('falls back to the generic message for unclassified errors', () => {
    const { t, spy } = createT();

    const result = handleDeleteError('Unexpected error occurred', t);

    expect(result).toEqual({
      message: 'Failed to delete item. Please try again.',
      severity: 'error',
    });

    expect(spy).toHaveBeenCalledWith(
      'errors:inventory.requests.failedToDeleteItem',
      'Failed to delete item. Please try again.',
    );
  });

  it('is deterministic when multiple keywords are present (mapping precedence)', () => {
    const { t } = createT();

    const result = handleDeleteError('404 Not Found - admin required', t);

    expect(result).toEqual({
      message: 'Only administrators can delete items.',
      severity: 'warning',
    });
  });
});
