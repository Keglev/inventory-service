/**
 * @file rowNormalizers.test.ts
 * @module tests/unit/api/inventory/rowNormalizers
 * @what_is_under_test toInventoryRow
 * @responsibility
 * Guarantees list-row normalization contracts for inventory grids: reject invalid inputs,
 * map supported DTO shapes into `InventoryRow`, and apply deterministic defaults.
 * @out_of_scope
 * Full-list pagination and request wiring (covered by list fetcher tests).
 * @out_of_scope
 * UI rendering and formatting (placeholders, localization, and presentation concerns).
 */

import { describe, expect, it } from 'vitest';

import { toInventoryRow } from '../../../../api/inventory/rowNormalizers';

describe('toInventoryRow', () => {
  describe('input validation', () => {
    it('returns null for non-objects or rows missing id', () => {
      expect(toInventoryRow(null)).toBeNull();
      expect(toInventoryRow(undefined)).toBeNull();
      expect(toInventoryRow(5)).toBeNull();
      expect(toInventoryRow({ name: 'Widget' })).toBeNull();
    });
  });

  describe('field mapping', () => {
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
  });

  describe('fallbacks', () => {
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
});
