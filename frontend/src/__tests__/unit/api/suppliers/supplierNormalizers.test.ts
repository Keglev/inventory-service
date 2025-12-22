/**
 * @file supplierNormalizers.test.ts
 * @module api/suppliers/normalizers.test
 * 
 * Unit tests for supplier DTO normalization functions.
 * Tests toSupplierRow with valid/invalid inputs, missing fields, type coercion.
 */

import { describe, it, expect } from 'vitest';
import { toSupplierRow } from '@/api/suppliers/supplierNormalizers';

describe('toSupplierRow', () => {
  it('should normalize valid supplier object with all fields', () => {
    const raw = {
      id: '123',
      name: 'Acme Corp',
      contactName: 'John Doe',
      phone: '+1234567890',
      email: 'john@acme.com',
      createdBy: 'admin',
      createdAt: '2023-01-15T10:30:00Z',
    };

    const result = toSupplierRow(raw);
    // Assert the normalized output
    expect(result).toEqual({
      id: '123',
      name: 'Acme Corp',
      contactName: 'John Doe',
      phone: '+1234567890',
      email: 'john@acme.com',
      createdBy: 'admin',
      createdAt: '2023-01-15T10:30:00Z',
    });
  });

  it('should normalize supplier with numeric id to string', () => {
    const raw = {
      id: 456,
      name: 'Beta Inc',
    };

    const result = toSupplierRow(raw);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('456');
    expect(result?.name).toBe('Beta Inc');
  });

  it('should set missing optional fields to null', () => {
    const raw = {
      id: '789',
      name: 'Gamma Ltd',
    };

    const result = toSupplierRow(raw);

    expect(result).toEqual({
      id: '789',
      name: 'Gamma Ltd',
      contactName: null,
      phone: null,
      email: null,
      createdBy: null,
      createdAt: null,
    });
  });

  it('should return null if id is missing', () => {
    const raw = {
      name: 'No ID Supplier',
      contactName: 'Jane',
    };

    expect(toSupplierRow(raw)).toBeNull();
  });

  it('should return null if name is missing', () => {
    const raw = {
      id: '999',
      contactName: 'Missing Name',
    };

    expect(toSupplierRow(raw)).toBeNull();
  });

  it('should return null for non-object input', () => {
    expect(toSupplierRow(null)).toBeNull();
    expect(toSupplierRow(undefined)).toBeNull();
    expect(toSupplierRow('string')).toBeNull();
    expect(toSupplierRow(123)).toBeNull();
    expect(toSupplierRow([])).toBeNull();
  });

  it('should handle empty string values for optional fields', () => {
    const raw = {
      id: '555',
      name: 'Empty Fields Co',
      contactName: '',
      phone: '',
      email: '',
    };

    const result = toSupplierRow(raw);

    expect(result).not.toBeNull();
    expect(result?.contactName).toBe('');
    expect(result?.phone).toBe('');
    expect(result?.email).toBe('');
  });

  it('should handle numeric id but not coerce optional fields', () => {
    const raw = {
      id: 777,
      name: 'Numeric ID Co',
      phone: 'valid-phone',
    };

    const result = toSupplierRow(raw);

    expect(result?.id).toBe('777');
    expect(result?.phone).toBe('valid-phone');
    expect(result?.contactName).toBeNull();
  });
});
