/**
 * @file rowFieldExtractors.ts
 * @module api/inventory/rowFieldExtractors
 *
 * @summary
 * Field-level extractors for inventory row normalization. Each function pulls one
 * logical field (or field group) from a raw backend record using defensive,
 * multi-variant field picking to tolerate backend naming inconsistencies.
 * Extracted from normalizeInventoryRow to keep that composer small and to give
 * each backend-contract concern a single, testable touch point (ST-6).
 */

import { pickString, pickNumber, pickNumberFromList, pickStringFromList } from '@/api/shared';

/** Required identity. Tries id / itemId / item_id; undefined when none present. */
export function extractId(raw: Record<string, unknown>): string | undefined {
  return (
    pickString(raw, 'id') ??
    pickString(raw, 'itemId') ??
    pickString(raw, 'item_id')
  );
}

/** Display name; em-dash placeholder when absent. */
export function extractName(raw: Record<string, unknown>): string {
  return (
    pickString(raw, 'name') ??
    pickString(raw, 'itemName') ??
    pickString(raw, 'title') ??
    '—'
  );
}

/** Item code / SKU; null when absent. */
export function extractCode(raw: Record<string, unknown>): string | null {
  return (
    pickString(raw, 'code') ??
    pickString(raw, 'sku') ??
    pickString(raw, 'itemCode') ??
    null
  );
}

/** Supplier id (string or numeric) and name. */
export function extractSupplier(raw: Record<string, unknown>): {
  supplierId: string | number | null;
  supplierName: string | null;
} {
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

  return { supplierId, supplierName };
}

/** On-hand stock (defaults 0) and optional minimum/reorder level. */
export function extractQuantities(raw: Record<string, unknown>): {
  onHand: number;
  minQty: number | null;
} {
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

  return { onHand, minQty };
}

/** "Last updated" timestamp. Backend has no updatedAt field; the fallback chain surfaces the creation timestamp for the grid's "last updated" column. */
export function extractUpdatedAt(raw: Record<string, unknown>): string | null {
  return pickStringFromList(raw, [
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
}
