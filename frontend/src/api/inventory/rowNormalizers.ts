/**
 * @module api/inventory/rowNormalizers
 *
 * @summary
 * DTO normalization for inventory list rows.
 * Converts raw API responses to strongly-typed InventoryRow shapes.
 * Maps backend fields (quantity, minimumQuantity, sku) -> frontend fields (onHand, minQty, code).
 *
 * @enterprise
 * - Single responsibility: DTO -> InventoryRow transformation
 * - Handles backend field name mappings transparently
 * - Type-safe with full TypeScript support
 * - Reusable for both single rows and batch operations
 */

import type { InventoryRow } from './types';
import { pickString, pickNumber } from '../shared/fieldPickers';

/**
 * Normalize a raw API response object into a strongly-typed InventoryRow.
 * Maps backend fields:
 *  - id -> itemId
 *  - quantity -> onHand
 *  - minimumQuantity -> minQty
 *  - createdAt -> createdAt (creation timestamp; backend has no update field)
 *
 * @param raw - Raw DTO from API response
 * @returns InventoryRow with all fields safely extracted and coerced, or null if invalid
 *
 * @example
 * ```typescript
 * const rows = response.content
 *   .map(toInventoryRow)
 *   .filter((r): r is InventoryRow => r !== null);
 * ```
 */
export const toInventoryRow = (raw: unknown): InventoryRow | null => {
  if (typeof raw !== 'object' || raw === null) return null;

  const r = raw as Record<string, unknown>;

  // ID is required
  const id = pickString(r, 'id');
  if (!id) return null;

  const name = pickString(r, 'name') ?? '—';
  // The item code is InventoryItemDTO's `sku`
  const code = pickString(r, 'sku') ?? null;

  const supplierIdStr = pickString(r, 'supplierId');
  const supplierId: string | number | null = supplierIdStr ?? null;

  const supplierName = pickString(r, 'supplierName') ?? null;

  // quantity -> onHand
  const onHand = pickNumber(r, 'quantity') ?? 0;

  // minimumQuantity -> minQty
  const minQty = pickNumber(r, 'minimumQuantity') ?? null;

  // price -> price (unit price); totalValue -> totalValue (falls back to price x onHand)
  const price = pickNumber(r, 'price') ?? null;
  const totalValue = pickNumber(r, 'totalValue') ?? (price != null ? price * onHand : null);

  // createdAt -> createdAt (creation timestamp for display)
  const createdAt = pickString(r, 'createdAt') ?? null;

  return {
    id,
    name,
    code,
    supplierId,
    supplierName,
    onHand,
    minQty,
    price,
    totalValue,
    createdAt,
  };
};
