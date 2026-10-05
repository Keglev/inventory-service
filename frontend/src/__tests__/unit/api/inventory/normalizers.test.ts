/**
 * @file normalizers.test.ts
 * @module tests/unit/api/inventory/normalizers
 * @description Contract tests for normalizeInventoryRow.
 *
 * Contract under test:
 * - Guarantees normalization contracts for inventory list DTOs: required
 *   identifiers, tolerant field mapping across backend variants, and
 *   null-safe defaults for optional fields.
 *
 * Out of scope:
 * - UI rendering semantics (placeholder copy, formatting, and
 *   localization concerns).
 */

import { describe, expect, it } from 'vitest';

import { normalizeInventoryRow } from '../../../../api/inventory/normalizers';

const basePayload = {
  id: 'ITEM-1',
  name: 'Widget',
  sku: 'SKU-1',
  supplierId: 'SUP-1',
  supplierName: 'Acme',
  quantity: 25,
  minimumQuantity: 5,
  createdAt: '2024-01-01T00:00:00Z',
};

describe('normalizeInventoryRow', () => {
  describe('required identifiers', () => {
    it('returns null when identifier is missing', () => {
      expect(normalizeInventoryRow({})).toBeNull();
      expect(normalizeInventoryRow(undefined)).toBeNull();
      expect(normalizeInventoryRow({ name: 'Widget' })).toBeNull();
    });
  });

  describe('field mapping', () => {
    it('maps InventoryItemDTO fields directly with safe defaults', () => {
      const row = normalizeInventoryRow(basePayload);

      expect(row).toEqual({
        id: 'ITEM-1',
        name: 'Widget',
        code: 'SKU-1',
        supplierId: 'SUP-1',
        supplierName: 'Acme',
        onHand: 25,
        minQty: 5,
        createdAt: '2024-01-01T00:00:00Z',
      });
    });

    it('coerces numeric strings and reads no other field spelling', () => {
      const row = normalizeInventoryRow({
        id: 'ITEM-2',
        name: 'Second Widget',
        // Spellings the backend never sends are not read.
        itemCode: 'ALT-001',
        supplier: 'Bravo',
        createdDate: '2024-02-02T10:00:00Z',
        quantity: '30',
        minimumQuantity: '7',
      });

      expect(row).toEqual({
        id: 'ITEM-2',
        name: 'Second Widget',
        code: null,
        supplierId: null,
        supplierName: null,
        onHand: 30,
        minQty: 7,
        createdAt: null,
      });
    });
  });

  describe('fallbacks', () => {
    it('ignores a non-string supplier id (the DTO sends a UUID string)', () => {
      const row = normalizeInventoryRow({
        id: 'ITEM-3',
        name: 'Numeric Supplier',
        supplierId: 123,
        quantity: 4,
      });

      expect(row).toEqual({
        id: 'ITEM-3',
        name: 'Numeric Supplier',
        code: null,
        supplierId: null,
        supplierName: null,
        onHand: 4,
        minQty: null,
        createdAt: null,
      });
    });
  });
});
