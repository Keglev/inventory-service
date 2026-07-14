/**
 * @file supplierServerErrors.test.ts
 * @module __tests__/components/pages/suppliers/supplierServerErrors
 * @description Contract tests for the shared supplier error classifier.
 *
 * Contract under test:
 * - Classification keys on the status code and the status token only; the
 *   server's free-text message is never consulted.
 * - 409 resolves by operation: duplicate name on add/update, linked items on
 *   delete.
 * - A duplicate name is recognised from fieldErrors.name, and also from a bare
 *   409 so the client stays correct against a backend without field attribution.
 *
 * Out of scope:
 * - Envelope extraction (api/shared/errorHandling) and dialog rendering.
 *
 * Test strategy:
 * - Resolve translations through the English resource bundle; assert copy.
 */

import { describe, it, expect, vi } from 'vitest';
import type { TFunction } from 'i18next';

import {
  isSupplierNameConflict,
  supplierErrorMessage,
} from '../../../../pages/suppliers/dialogs/supplierServerErrors';
import { tEn } from '../../../test/i18nEn';

const t = vi.fn((key: string, options?: Record<string, unknown>) =>
  tEn(key, options)
) as unknown as TFunction<['common', 'suppliers', 'errors']>;

describe('isSupplierNameConflict', () => {
  it('is true when the backend attributes the conflict to the name field', () => {
    expect(isSupplierNameConflict({ fieldErrors: { name: 'Supplier already exists' } })).toBe(true);
  });

  it('is true for a bare 409, so a backend without field attribution still works', () => {
    expect(isSupplierNameConflict({ status: 409 })).toBe(true);
    expect(isSupplierNameConflict({ errorToken: 'conflict' })).toBe(true);
  });

  it('is false for every other failure', () => {
    expect(isSupplierNameConflict({})).toBe(false);
    expect(isSupplierNameConflict({ status: 403 })).toBe(false);
    expect(isSupplierNameConflict({ status: 500 })).toBe(false);
  });
});

describe('supplierErrorMessage', () => {
  it('resolves 409 by operation', () => {
    expect(supplierErrorMessage({ status: 409 }, t, 'add')).toBe(
      'A supplier with this name already exists'
    );
    expect(supplierErrorMessage({ status: 409 }, t, 'update')).toBe(
      'A supplier with this name already exists'
    );
    expect(supplierErrorMessage({ status: 409 }, t, 'delete')).toContain('cannot be deleted');
  });

  it('resolves 403 to admin-only regardless of operation', () => {
    expect(supplierErrorMessage({ errorToken: 'forbidden' }, t, 'add')).toBe(
      'Only administrators can perform this action.'
    );
    expect(supplierErrorMessage({ status: 403 }, t, 'delete')).toBe(
      'Only administrators can perform this action.'
    );
  });

  it('resolves 404 to supplier not found', () => {
    expect(supplierErrorMessage({ status: 404 }, t, 'delete')).toBe('Supplier not found');
  });

  it('falls back per operation when the failure is unclassified', () => {
    expect(supplierErrorMessage({}, t, 'add')).toBe('Failed to add supplier. Please try again.');
    expect(supplierErrorMessage({}, t, 'update')).toBe(
      'Failed to update supplier. Please try again.'
    );
    expect(supplierErrorMessage({ status: 500 }, t, 'delete')).toBe(
      'Failed to delete supplier. Please try again.'
    );
  });
});
