/**
 * @file rowFieldExtractors.test.ts
 * @module tests/unit/api/inventory/rowFieldExtractors
 * @what_is_under_test extractId, extractName, extractCode, extractSupplier, extractQuantities, extractCreatedAt
 */

import { describe, it, expect } from 'vitest';
import {
  extractId,
  extractName,
  extractCode,
  extractSupplier,
  extractQuantities,
  extractCreatedAt,
} from '../../../../api/inventory/rowFieldExtractors';

describe('extractId', () => {
  it('reads id / itemId / item_id in order', () => {
    expect(extractId({ id: 'a' })).toBe('a');
    expect(extractId({ itemId: 'b' })).toBe('b');
    expect(extractId({ item_id: 'c' })).toBe('c');
  });
  it('returns undefined when no identity key is present', () => {
    expect(extractId({})).toBeUndefined();
  });
});

describe('extractName', () => {
  it('falls back through variants to an em-dash placeholder', () => {
    expect(extractName({ name: 'Widget' })).toBe('Widget');
    expect(extractName({ title: 'T' })).toBe('T');
    expect(extractName({})).toBe('—');
  });
});

describe('extractCode', () => {
  it('reads code / sku / itemCode, else null', () => {
    expect(extractCode({ sku: 'SKU1' })).toBe('SKU1');
    expect(extractCode({})).toBeNull();
  });
});

describe('extractSupplier', () => {
  it('prefers a string supplierId, falls back to numeric, else null', () => {
    expect(extractSupplier({ supplierId: '7' }).supplierId).toBe('7');
    expect(extractSupplier({ supplierId: 7 }).supplierId).toBe(7);
    expect(extractSupplier({}).supplierId).toBeNull();
  });
  it('reads supplierName / supplier, else null', () => {
    expect(extractSupplier({ supplierName: 'Acme' }).supplierName).toBe('Acme');
    expect(extractSupplier({}).supplierName).toBeNull();
  });
});

describe('extractQuantities', () => {
  it('defaults onHand to 0 and minQty to null', () => {
    expect(extractQuantities({})).toEqual({ onHand: 0, minQty: null });
  });
  it('reads onHand from the backend quantity field only', () => {
    expect(extractQuantities({ quantity: 3 }).onHand).toBe(3);
    expect(extractQuantities({ stock: 12 }).onHand).toBe(0);
  });
});

describe('extractCreatedAt', () => {
  it('reads the createdAt creation timestamp, else null', () => {
    expect(extractCreatedAt({ createdAt: '2024-01-01' })).toBe('2024-01-01');
    expect(extractCreatedAt({})).toBeNull();
  });
});
