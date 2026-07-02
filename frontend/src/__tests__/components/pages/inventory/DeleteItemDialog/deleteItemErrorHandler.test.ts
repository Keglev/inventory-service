/**
 * @file deleteItemErrorHandler.test.ts
 * @module __tests__/components/pages/inventory/DeleteItemDialog/deleteItemErrorHandler
 * @description Unit tests for handleDeleteError utility.
 *
 * Contract under test:
 * - Maps the backend's structured status token into a user-friendly message + severity.
 * - Requests i18n keys single-arg; the t stub echoes the key, so assertions
 *   verify the exact resource key requested per token.
 */

import { describe, it, expect, vi } from 'vitest';
import type { TFunction } from 'i18next';

import { handleDeleteError } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/deleteItemErrorHandler';

// -------------------------------------
// Helpers
// -------------------------------------

type TSpy = ReturnType<typeof vi.fn<[key: string], string>>;

/**
 * Translation stub: echoes the requested key.
 */
function createT(): { t: TFunction<['common', 'inventory', 'errors']>; spy: TSpy } {
  const spy: TSpy = vi.fn((key: string) => key);
  return { t: spy as unknown as TFunction<['common', 'inventory', 'errors']>, spy };
}

describe('handleDeleteError', () => {
  it('returns a generic message when no token is present', () => {
    const { t, spy } = createT();

    const result = handleDeleteError(undefined, t);

    expect(result).toEqual({
      message: 'errors:inventory.requests.failedToDeleteItem',
      severity: 'error',
    });
    expect(spy).toHaveBeenCalledWith('errors:inventory.requests.failedToDeleteItem');
  });

  it('maps the conflict token to the quantity rule with error severity', () => {
    const { t, spy } = createT();

    const result = handleDeleteError({ errorToken: 'conflict' }, t);

    expect(result).toEqual({
      message: 'errors:inventory.businessRules.quantityMustBeZero',
      severity: 'error',
    });
    expect(spy).toHaveBeenCalledWith('errors:inventory.businessRules.quantityMustBeZero');
  });

  it('maps the forbidden token to admin-only with warning severity', () => {
    const { t, spy } = createT();

    const result = handleDeleteError({ errorToken: 'forbidden' }, t);

    expect(result).toEqual({
      message: 'errors:inventory.businessRules.adminOnly',
      severity: 'warning',
    });
    expect(spy).toHaveBeenCalledWith('errors:inventory.businessRules.adminOnly');
  });

  it('maps the not_found token to item-not-found with warning severity', () => {
    const { t, spy } = createT();

    const result = handleDeleteError({ errorToken: 'not_found' }, t);

    expect(result).toEqual({
      message: 'errors:inventory.businessRules.itemNotFound',
      severity: 'warning',
    });
    expect(spy).toHaveBeenCalledWith('errors:inventory.businessRules.itemNotFound');
  });

  it('falls back to the generic message for an unmapped token', () => {
    const { t } = createT();

    const result = handleDeleteError({ errorToken: 'internal_server_error' }, t);

    expect(result).toEqual({
      message: 'errors:inventory.requests.failedToDeleteItem',
      severity: 'error',
    });
  });

  it('falls back to the generic message when errorToken is null', () => {
    const { t } = createT();

    const result = handleDeleteError({ errorToken: null }, t);

    expect(result).toEqual({
      message: 'errors:inventory.requests.failedToDeleteItem',
      severity: 'error',
    });
  });
});
