/**
 * @file mapSupplierErrors.test.ts
 * @module __tests__/components/pages/suppliers/EditSupplierDialog/mapSupplierErrors
 * @description Contract tests for the `mapSupplierError` adapter.
 *
 * Contract under test:
 * - Classifies a failed update from the structured error envelope (status and
 *   status token), never from the server's free-text message.
 * - Pins the operation to 'update', so a 409 reads as a duplicate name rather
 *   than as the delete dialog's linked-items rule.
 * - Falls back to the generic update failure when the envelope is empty.
 *
 * Out of scope:
 * - Toast presentation and UI rendering.
 * - Envelope extraction itself (covered by the api/shared error-handling tests).
 *
 * Test strategy:
 * - Resolve translations through the English resource bundle and assert the
 *   rendered copy, not the i18n key.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TFunction } from 'i18next';

import { mapSupplierError } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/mapSupplierErrors';
import { tEn } from '../../../../test/i18nEn';

const tMock = vi.fn((key: string, options?: Record<string, unknown>) => tEn(key, options));
const translate = tMock as unknown as TFunction<['common', 'suppliers', 'errors']>;

describe('mapSupplierError', () => {
  beforeEach(() => {
    tMock.mockClear();
  });

  it('returns the generic update message when the envelope is empty', () => {
    expect(mapSupplierError({}, translate)).toBe('Failed to update supplier. Please try again.');
  });

  it('classifies a 403 as admin-only', () => {
    expect(mapSupplierError({ status: 403 }, translate)).toBe(
      'Only administrators can perform this action.'
    );
    expect(mapSupplierError({ errorToken: 'forbidden' }, translate)).toBe(
      'Only administrators can perform this action.'
    );
  });

  it('classifies a 404 as supplier not found', () => {
    expect(mapSupplierError({ status: 404 }, translate)).toBe('Supplier not found');
    expect(mapSupplierError({ errorToken: 'not_found' }, translate)).toBe('Supplier not found');
  });

  it('classifies a 409 on update as a duplicate name, not as the delete rule', () => {
    expect(mapSupplierError({ status: 409, errorToken: 'conflict' }, translate)).toBe(
      'A supplier with this name already exists'
    );
  });

  it('classifies a duplicate name carrying field attribution', () => {
    expect(
      mapSupplierError(
        { status: 409, errorToken: 'conflict', fieldErrors: { name: 'Supplier already exists' } },
        translate
      )
    ).toBe('A supplier with this name already exists');
  });

  it('ignores the server message: an unclassified status falls back', () => {
    expect(mapSupplierError({ status: 500, errorToken: 'internal_server_error' }, translate)).toBe(
      'Failed to update supplier. Please try again.'
    );
  });
});
