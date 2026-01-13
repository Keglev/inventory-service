/**
 * @file deleteItemErrorHandler.test.ts
 *
 * @what_is_under_test handleDeleteError utility
 * @responsibility Map API error responses to user-friendly messages
 * @out_of_scope React hooks, toast notifications
 */

import { describe, it, expect, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { handleDeleteError } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/deleteItemErrorHandler';

// Helper: provides translation stub that returns provided fallback messages
const createTranslationMock = () =>
  vi.fn((key: string, fallback?: string) => (fallback as string | undefined) ?? key);

describe('handleDeleteError', () => {
  it('returns generic message when error text is missing', () => {
    const t = createTranslationMock();

    const result = handleDeleteError(undefined, t as unknown as TFunction);

    expect(result).toEqual({
      message: 'Failed to delete item. Please try again.',
      severity: 'error',
    });
    expect(t).toHaveBeenCalledWith(
      'errors:inventory.requests.failedToDeleteItem',
      'Failed to delete item. Please try again.'
    );
  });

  it('maps quantity rule violation to error severity', () => {
    const t = createTranslationMock();

    const result = handleDeleteError('You still have merchandise in stock', t as unknown as TFunction);

    expect(result).toEqual({
      message:
        'You still have merchandise in stock. You need to first remove items from stock by changing quantity.',
      severity: 'error',
    });
    expect(t).toHaveBeenCalledWith(
      'errors:inventory.businessRules.quantityMustBeZero',
      'You still have merchandise in stock. You need to first remove items from stock by changing quantity.'
    );
  });

  it('maps admin permission failure to warning severity', () => {
    const t = createTranslationMock();

    const result = handleDeleteError('Access denied: admin required', t as unknown as TFunction);

    expect(result).toEqual({
      message: 'Only administrators can delete items.',
      severity: 'warning',
    });
    expect(t).toHaveBeenCalledWith(
      'errors:inventory.businessRules.adminOnly',
      'Only administrators can delete items.'
    );
  });

  it('maps not found errors to warning severity with explanation', () => {
    const t = createTranslationMock();

    const result = handleDeleteError('404 Not Found', t as unknown as TFunction);

    expect(result).toEqual({
      message: 'Item not found. It may have been deleted by another user.',
      severity: 'warning',
    });
    expect(t).toHaveBeenCalledWith(
      'errors:inventory.businessRules.itemNotFound',
      'Item not found. It may have been deleted by another user.'
    );
  });

  it('falls back to generic message for unclassified errors', () => {
    const t = createTranslationMock();

    const result = handleDeleteError('Unexpected error occurred', t as unknown as TFunction);

    expect(result).toEqual({
      message: 'Failed to delete item. Please try again.',
      severity: 'error',
    });
    expect(t).toHaveBeenCalledWith(
      'errors:inventory.requests.failedToDeleteItem',
      'Failed to delete item. Please try again.'
    );
  });
});
