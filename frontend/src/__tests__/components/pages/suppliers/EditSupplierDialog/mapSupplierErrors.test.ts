/**
 * @file mapSupplierErrors.test.ts
 *
 * @what_is_under_test mapSupplierError utility
 * @responsibility Translate backend error messages into localized user-facing text
 * @out_of_scope Rendering logic, toast presentation
 */

import { describe, it, expect, vi } from 'vitest';
import type { TFunction } from 'i18next';

import { mapSupplierError } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/mapSupplierErrors';

const tMock = vi.fn((key: string, fallback?: string) => fallback ?? key);
const translate = tMock as unknown as TFunction;

describe('mapSupplierError', () => {
  beforeEach(() => {
    tMock.mockClear();
  });

  it('returns generic message when error is absent', () => {
    expect(mapSupplierError(undefined, translate)).toBe('Failed to update supplier. Please try again.');
    expect(mapSupplierError(null, translate)).toBe('Failed to update supplier. Please try again.');
  });

  it('detects admin-only errors', () => {
    expect(mapSupplierError('403 Forbidden: admin only', translate)).toBe(
      'Only administrators can edit supplier information.'
    );
  });

  it('detects missing creator information', () => {
    expect(mapSupplierError('createdBy is required', translate)).toBe(
      'Creator information is required. Please ensure you are logged in.'
    );
  });

  it('detects duplicate email conflicts', () => {
    expect(mapSupplierError('Duplicate email detected', translate)).toBe('This email is already in use.');
    expect(mapSupplierError('email already exists', translate)).toBe('This email is already in use.');
  });

  it('falls back to generic message for unknown errors', () => {
    expect(mapSupplierError('Unexpected network issue', translate)).toBe(
      'Failed to update supplier. Please try again.'
    );
  });
});
