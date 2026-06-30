/**
 * @file normalizers.ts
 * @module api/inventory/normalizers
 *
 * @summary
 * Data normalization utilities for inventory API responses.
 * Converts raw backend payloads into typed frontend models using defensive field picking:
 * never throws, returns null for invalid data, guards types before unsafe operations,
 * and accepts multiple field-name variants to tolerate backend naming inconsistencies.
 */

import type { InventoryRow } from './types';
import { isRecord, pickString, pickNumber, pickNumberFromList, pickStringFromList } from '@/api/shared';

/**
 * Normalizes a raw backend response into a typed InventoryRow.
 * Returns null (never throws) when the required `id` field is absent.
 * Tries multiple field-name variants per field to tolerate backend naming inconsistencies.
 *
 * @param raw - Unknown backend response data
 * @returns Normalized InventoryRow, or null if `id` is missing
 */
export function normalizeInventoryRow(raw: unknown): InventoryRow | null {
  if (!isRecord(raw)) return null;

  const id =
    pickString(raw, 'id') ??
    pickString(raw, 'itemId') ??
    pickString(raw, 'item_id');

  if (!id) return null;

  const name =
    pickString(raw, 'name') ??
    pickString(raw, 'itemName') ??
    pickString(raw, 'title') ??
    '—';

  const code =
    pickString(raw, 'code') ??
    pickString(raw, 'sku') ??
    pickString(raw, 'itemCode') ??
    null;

  const supplierIdRaw =
    pickString(raw, 'supplierId') ??
    pickString(raw, 'supplier_id');
  const supplierIdNum = pickNumber(raw, 'supplierId');
  const supplierId: string | number | null =
    supplierIdRaw ?? (typeof supplierIdNum === 'number' ? supplierIdNum : null);

  const supplierName =
    pickString(raw, 'supplierName') ??
    pickString(raw, 'supplier') ??
    null;

  const onHand = pickNumberFromList(raw, [
    'quantity',
    'onHand',
    'availableQuantity',
    'stockQuantity',
    'stockQty',
    'qty',
    'currentQuantity',
    'currentQty',
    'quantityOnHand',
    'onHandQuantity',
    'stock',
  ]) ?? 0;

  const minQty =
    pickNumberFromList(raw, [
      'minimumQuantity',
      'minQty',
      'min_quantity',
      'minimum',
      'reorderLevel',
    ]) ?? null;

  // Backend has no updatedAt field; the fallback chain surfaces the creation timestamp for the grid's "last updated" column.
  const updatedAt = pickStringFromList(raw, [
    'updatedAt',
    'updated_at',
    'lastUpdate',
    'lastModified',
    'lastModifiedDate',
    'modifiedAt',
    'modified_at',
    'createdAt',
    'created_at',
    'createdDate',
    'created_date',
    'created',
  ]) ?? null;

  return {
    id: String(id),
    name,
    code,
    supplierId,
    supplierName,
    onHand,
    minQty,
    updatedAt,
  };
}
