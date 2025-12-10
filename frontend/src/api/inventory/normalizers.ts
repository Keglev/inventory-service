/**
 * @file normalizers.ts
 * @module api/inventory/normalizers
 *
 * @summary
 * Data normalization utilities for inventory API responses.
 * Converts tolerant backend responses into typed frontend models.
 *
 * @enterprise
 * - Tolerant parsing: handles missing/unknown fields gracefully
 * - Type narrowing via guards before unsafe operations
 * - No throwing: returns null for invalid data instead of errors
 * - Defensive field mapping with fallback chains
 */

import type { InventoryRow } from './types';
import {
  isRecord,
  pickString,
  pickNumber,
  pickNumberFromList,
  pickStringFromList,
} from './utils';

/**
 * Normalize raw backend response into typed InventoryRow.
 * Returns null if required fields (id) are missing.
 * Uses defensive field picking with fallback chains for flexibility.
 *
 * @param raw - Unknown backend response data
 * @returns Normalized InventoryRow or null if validation fails
 *
 * @enterprise
 * - Accepts multiple field name variations from backend
 * - Gracefully handles missing optional fields
 * - Never throws; returns null for invalid data
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

  // Backend list payload only has createdAt; surface it as updatedAt for the grid.
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
