/**
 * @file supplierNormalizers.test.ts
 * @module tests/unit/api/suppliers/supplierNormalizers
 * @what_is_under_test toSupplierRow
 * @responsibility
 * Guarantees supplier DTO normalization contracts: required identifiers, deterministic defaults
 * for optional fields, and safe null returns for invalid inputs.
 * @out_of_scope
 * Supplier list fetching/envelope parsing (handled by supplier list fetcher tests).
 * @out_of_scope
 * Validation and user input trimming/coercion beyond what normalization explicitly performs.
 */

import { describe, expect, it } from 'vitest';
import { toSupplierRow } from '@/api/suppliers/supplierNormalizers';

describe('toSupplierRow', () => {
  describe('accepts valid supplier inputs', () => {
    it('normalizes a supplier with all supported fields', () => {
      const raw = {
        id: '123',
        name: 'Acme Corp',
        contactName: 'John Doe',
        phone: '+1234567890',
        email: 'john@acme.com',
        createdBy: 'admin',
        createdAt: '2023-01-15T10:30:00Z',
      };

      expect(toSupplierRow(raw)).toEqual({
        id: '123',
        name: 'Acme Corp',
        contactName: 'John Doe',
        phone: '+1234567890',
        email: 'john@acme.com',
        createdBy: 'admin',
        createdAt: '2023-01-15T10:30:00Z',
      });
    });

    it('coerces numeric ids into string ids', () => {
      const result = toSupplierRow({ id: 456, name: 'Beta Inc' });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('456');
      expect(result?.name).toBe('Beta Inc');
    });
  });

  describe('fallbacks', () => {
    it('sets missing optional fields to null', () => {
      expect(toSupplierRow({ id: '789', name: 'Gamma Ltd' })).toEqual({
        id: '789',
        name: 'Gamma Ltd',
        contactName: null,
        phone: null,
        email: null,
        createdBy: null,
        createdAt: null,
      });
    });

    it('preserves empty strings for optional fields when provided', () => {
      const result = toSupplierRow({
        id: '555',
        name: 'Empty Fields Co',
        contactName: '',
        phone: '',
        email: '',
      });

      expect(result).not.toBeNull();
      expect(result?.contactName).toBe('');
      expect(result?.phone).toBe('');
      expect(result?.email).toBe('');
    });

    it('does not invent optional fields when only some are provided', () => {
      const result = toSupplierRow({ id: 777, name: 'Numeric ID Co', phone: 'valid-phone' });

      expect(result?.id).toBe('777');
      expect(result?.phone).toBe('valid-phone');
      expect(result?.contactName).toBeNull();
    });
  });

  describe('rejects invalid inputs', () => {
    it('returns null when id is missing', () => {
      expect(toSupplierRow({ name: 'No ID Supplier', contactName: 'Jane' })).toBeNull();
    });

    it('returns null when name is missing', () => {
      expect(toSupplierRow({ id: '999', contactName: 'Missing Name' })).toBeNull();
    });

    it('returns null for non-object values', () => {
      expect(toSupplierRow(null)).toBeNull();
      expect(toSupplierRow(undefined)).toBeNull();
      expect(toSupplierRow('string')).toBeNull();
      expect(toSupplierRow(123)).toBeNull();
      expect(toSupplierRow([])).toBeNull();
    });
  });
});
