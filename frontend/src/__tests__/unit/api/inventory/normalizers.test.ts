/**
 * @file normalizers.test.ts
 * @module tests/api/inventory/normalizers
 *
 * @summary
 * Validates the DTO normalization logic that tolerates multiple backend field variants.
 * Ensures normalizeInventoryRow gracefully maps heterogeneous payloads into typed InventoryRow objects.
 *
 * @enterprise
 * - Guards mission-critical list rendering against backend field drift
 * - Confirms null-safe fallbacks so UI never crashes on malformed rows
 * - Locks in default coercion (names, codes, supplier identity, audit timestamps)
 */

import { describe, expect, it } from 'vitest';

import { normalizeInventoryRow } from '../../../../api/inventory/normalizers';

const basePayload = {
  id: 'ITEM-1',
  name: 'Widget',
  code: 'SKU-1',
  supplierId: 'SUP-1',
  supplierName: 'Acme',
  quantity: 25,
  minimumQuantity: 5,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('normalizeInventoryRow', () => {
  it('returns null when identifier is missing', () => {
    expect(normalizeInventoryRow({})).toBeNull();
    expect(normalizeInventoryRow(undefined)).toBeNull();
    expect(normalizeInventoryRow({ name: 'Widget' })).toBeNull();
  });

  it('maps canonical fields directly with safe defaults', () => {
    const row = normalizeInventoryRow(basePayload);

    expect(row).toEqual({
      id: 'ITEM-1',
      name: 'Widget',
      code: 'SKU-1',
      supplierId: 'SUP-1',
      supplierName: 'Acme',
      onHand: 25,
      minQty: 5,
      updatedAt: '2024-01-01T00:00:00Z',
    });
  });

  it('honors alternative field names and coalesces supplier id types', () => {
    const row = normalizeInventoryRow({
      itemId: 'ITEM-2',
      itemName: 'Alt Widget',
      itemCode: 'ALT-001',
      supplier_id: 'SUP-2',
      supplier: 'Bravo',
      availableQuantity: '30',
      reorderLevel: '7',
      lastModifiedDate: '2024-02-02T10:00:00Z',
    });

    expect(row).toEqual({
      id: 'ITEM-2',
      name: 'Alt Widget',
      code: 'ALT-001',
      supplierId: 'SUP-2',
      supplierName: 'Bravo',
      onHand: 30,
      minQty: 7,
      updatedAt: '2024-02-02T10:00:00Z',
    });
  });

  it('falls back to numeric supplier id when string variant missing', () => {
    const row = normalizeInventoryRow({
      id: 'ITEM-3',
      name: 'Numeric Supplier',
      supplierId: 123,
      stockQuantity: 4,
    });

    expect(row).toEqual({
      id: 'ITEM-3',
      name: 'Numeric Supplier',
      code: null,
      supplierId: 123,
      supplierName: null,
      onHand: 4,
      minQty: null,
      updatedAt: null,
    });
  });
});
