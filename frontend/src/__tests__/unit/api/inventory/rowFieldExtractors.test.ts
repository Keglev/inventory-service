/**
 * @file rowFieldExtractors.test.ts
 * @module tests/unit/api/inventory/rowFieldExtractors
 * @description Contract tests for extractId, extractName, extractCode, extractSupplier,
 * extractQuantities, extractCreatedAt. Each reads InventoryItemDTO's own field
 * name only; spellings the backend never sends are not read.
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
  it('reads id only', () => {
    expect(extractId({ id: 'a' })).toBe('a');
    expect(extractId({ itemId: 'b' })).toBeUndefined();
  });
  it('returns undefined when no identity key is present', () => {
    expect(extractId({})).toBeUndefined();
  });
});

describe('extractName', () => {
  it('reads name, else an em-dash placeholder', () => {
    expect(extractName({ name: 'Widget' })).toBe('Widget');
    expect(extractName({ title: 'T' })).toBe('—');
    expect(extractName({})).toBe('—');
  });
});

describe('extractCode', () => {
  it('reads sku, else null', () => {
    expect(extractCode({ sku: 'SKU1' })).toBe('SKU1');
    expect(extractCode({ code: 'C1' })).toBeNull();
    expect(extractCode({})).toBeNull();
  });
});

describe('extractSupplier', () => {
  it('reads a string supplierId (a UUID in the DTO), else null', () => {
    expect(extractSupplier({ supplierId: '7' }).supplierId).toBe('7');
    expect(extractSupplier({ supplierId: 7 }).supplierId).toBeNull();
    expect(extractSupplier({}).supplierId).toBeNull();
  });
  it('reads supplierName, else null', () => {
    expect(extractSupplier({ supplierName: 'Acme' }).supplierName).toBe('Acme');
    expect(extractSupplier({ supplier: 'Bravo' }).supplierName).toBeNull();
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
    expect(extractCreatedAt({ createdDate: '2024-01-01' })).toBeNull();
    expect(extractCreatedAt({})).toBeNull();
  });
});
