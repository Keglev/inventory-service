/**
 * @file normalizers.ts
 * @module api/inventory/normalizers
 *
 * @summary
 * Data normalization for inventory API responses. Composes the field-level
 * extractors (see rowFieldExtractors) into a typed InventoryRow using defensive
 * field picking: never throws, returns null for invalid data, guards types before
 * unsafe operations, and tolerates multiple backend field-name variants per field.
 */

import type { InventoryRow } from './types';
import { isRecord } from '@/api/shared';
import {
  extractId,
  extractName,
  extractCode,
  extractSupplier,
  extractQuantities,
  extractUpdatedAt,
} from './rowFieldExtractors';

/**
 * Normalizes a raw backend response into a typed InventoryRow.
 * Returns null (never throws) when the input is not a record or the required `id` is absent.
 *
 * @param raw - Unknown backend response data
 * @returns Normalized InventoryRow, or null if invalid
 */
export function normalizeInventoryRow(raw: unknown): InventoryRow | null {
  if (!isRecord(raw)) return null;

  const id = extractId(raw);
  if (!id) return null;

  const { supplierId, supplierName } = extractSupplier(raw);
  const { onHand, minQty } = extractQuantities(raw);

  return {
    id: String(id),
    name: extractName(raw),
    code: extractCode(raw),
    supplierId,
    supplierName,
    onHand,
    minQty,
    updatedAt: extractUpdatedAt(raw),
  };
}
