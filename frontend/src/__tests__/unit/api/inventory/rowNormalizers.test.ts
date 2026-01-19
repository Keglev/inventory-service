/**
 * @file rowNormalizers.test.ts
 * @module tests/api/inventory/rowNormalizers
 *
 * @summary
 * Exercises the list row normalizer that powers inventory grid rendering.
 * Confirms toInventoryRow enforces required identifiers, field mapping, and defensive fallbacks.
 *
 * @enterprise
 * - Protects UI data grids from malformed DTOs by verifying null-outs for invalid rows
 * - Locks business-critical field translations (quantity -> onHand, minimumQuantity -> minQty)
 * - Ensures resilient defaults so customer-facing pages remain stable under data drift
 */

import { describe, expect, it } from 'vitest';

import { toInventoryRow } from '../../../../api/inventory/rowNormalizers';

describe('toInventoryRow', () => {
  it('returns null for non-objects or rows missing id', () => {
    expect(toInventoryRow(null)).toBeNull();
    expect(toInventoryRow(undefined)).toBeNull();
    expect(toInventoryRow(5)).toBeNull();
    expect(toInventoryRow({ name: 'Widget' })).toBeNull();
  });

  it('maps canonical field names into InventoryRow', () => {
    const result = toInventoryRow({
      id: 'ITEM-1',
      name: 'Widget',
      code: 'SKU-1',
      supplierId: 'SUP-1',
      supplierName: 'Acme',
      quantity: 15,
      minimumQuantity: 3,
      createdAt: '2024-03-03T00:00:00Z',
    });

    expect(result).toEqual({
      id: 'ITEM-1',
      name: 'Widget',
      code: 'SKU-1',
      supplierId: 'SUP-1',
      supplierName: 'Acme',
      onHand: 15,
      minQty: 3,
      updatedAt: '2024-03-03T00:00:00Z',
    });
  });

  it('applies defensive defaults when optional fields are absent', () => {
    const result = toInventoryRow({
      id: 'ITEM-2',
      quantity: undefined,
      minimumQuantity: undefined,
    });

    expect(result).toEqual({
      id: 'ITEM-2',
      name: '—',
      code: null,
      supplierId: null,
      supplierName: null,
      onHand: 0,
      minQty: null,
      updatedAt: null,
    });
  });
});
