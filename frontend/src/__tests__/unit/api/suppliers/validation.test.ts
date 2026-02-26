/**
 * @file validation.test.ts
 * @module tests/unit/api/suppliers/validation
 * @what_is_under_test createSupplierSchema / editSupplierSchema
 * @responsibility
 * Guarantees supplier validation schema contracts for form submissions: required fields,
 * normalization rules (trim/empty-to-null), and deterministic acceptance/rejection behavior.
 * @out_of_scope
 * UI form integration (error rendering, field-level touch/blur behavior, and submission flows).
 * @out_of_scope
 * Backend validation and persistence rules (server-side constraints may be stricter or differ).
 */

import { describe, expect, it } from 'vitest';
import { createSupplierSchema, editSupplierSchema } from '@/api/suppliers/validation';

type SafeParseSuccess<T> = { success: true; data: T };
type SafeParseFailure = { success: false; error: { issues: Array<{ message: string }> } };

function expectParseSuccess<T>(schema: { safeParse: (input: unknown) => SafeParseSuccess<T> | SafeParseFailure }, input: unknown) {
  const result = schema.safeParse(input);
  expect(result.success).toBe(true);
  if (!result.success) {
    throw new Error('Expected schema parse to succeed.');
  }
  return result.data;
}

function expectParseFailure(schema: { safeParse: (input: unknown) => SafeParseSuccess<unknown> | SafeParseFailure }, input: unknown) {
  const result = schema.safeParse(input);
  expect(result.success).toBe(false);
  if (result.success) {
    throw new Error('Expected schema parse to fail.');
  }
  return result.error;
}

describe('createSupplierSchema', () => {
  describe('success paths', () => {
    it('accepts name-only input and applies default nulls', () => {
      const data = expectParseSuccess(createSupplierSchema, { name: 'Acme Corp' });

      expect(data.name).toBe('Acme Corp');
      expect(data.contactName).toBeNull();
      expect(data.phone).toBeNull();
      expect(data.email).toBeNull();
    });

    it('accepts all optional contact fields when provided', () => {
      const input = {
        name: 'Beta Inc',
        contactName: 'John Doe',
        phone: '+1234567890',
        email: 'john@beta.com',
      };

      expect(expectParseSuccess(createSupplierSchema, input)).toEqual(input);
    });

    it('trims surrounding whitespace from name', () => {
      const data = expectParseSuccess(createSupplierSchema, { name: '  Gamma Ltd  ' });

      expect(data.name).toBe('Gamma Ltd');
    });

    it('normalizes empty strings to null for selected optional fields', () => {
      const data = expectParseSuccess(createSupplierSchema, {
        name: 'Delta Co',
        contactName: '',
        phone: '',
      });

      expect(data.contactName).toBeNull();
      expect(data.phone).toBeNull();
      expect(data.email).toBeNull();
    });
  });

  describe('failure paths', () => {
    it('rejects empty string for email', () => {
      const error = expectParseFailure(createSupplierSchema, { name: 'Email Test', email: '' });

      expect(error.issues[0].message).toBe('Invalid email format');
    });

    it('rejects missing name', () => {
      expectParseFailure(createSupplierSchema, { contactName: 'John' });
    });

    it('rejects invalid email format', () => {
      const error = expectParseFailure(createSupplierSchema, { name: 'Invalid Email Co', email: 'not-an-email' });

      expect(error.issues[0].message).toBe('Invalid email format');
    });
  });

  describe('edge cases', () => {
    it('accepts whitespace-only name and normalizes it to an empty string', () => {
      const data = expectParseSuccess(createSupplierSchema, { name: '   ' });

      expect(data.name).toBe('');
    });
  });
});

describe('editSupplierSchema', () => {
  describe('success paths', () => {
    it('accepts supplierId and contact fields', () => {
      const input = {
        supplierId: '123',
        contactName: 'Jane Doe',
        phone: '+9876543210',
        email: 'jane@example.com',
      };

      expect(expectParseSuccess(editSupplierSchema, input)).toEqual(input);
    });

    it('accepts explicit nulls for optional contact fields', () => {
      const input = {
        supplierId: '456',
        contactName: null,
        phone: null,
        email: null,
      };

      expect(expectParseSuccess(editSupplierSchema, input)).toEqual(input);
    });

    it('coerces invalid email to null instead of rejecting the edit payload', () => {
      const data = expectParseSuccess(editSupplierSchema, {
        supplierId: '789',
        contactName: 'Test User',
        phone: '555-1234',
        email: 'bad-email',
      });

      expect(data.email).toBeNull();
    });
  });

  describe('failure paths', () => {
    it('rejects missing supplierId', () => {
      expectParseFailure(editSupplierSchema, {
        contactName: 'No ID',
        phone: '123',
        email: 'test@test.com',
      });
    });

    it('rejects empty supplierId with a stable error message', () => {
      const error = expectParseFailure(editSupplierSchema, { supplierId: '', contactName: 'Test' });

      expect(error.issues[0].message).toBe('Supplier ID is required');
    });
  });
});
