/**
 * @file rowNormalizers.ts
 * @module api/inventory/rowNormalizers
 *
 * @summary
 * Normalizes one inventory DTO into the grid's InventoryRow shape.
 *
 * @enterprise
 * Backend fields map to frontend names (quantity -> onHand, minimumQuantity -> minQty,
 * sku -> code), so the grid never reads DTO names directly.
 */

import type { InventoryRow } from './types';
import { pickString, pickNumber } from '../shared/fieldPickers';

/**
 * Normalize a raw API response object into a strongly-typed InventoryRow.
 * Maps backend fields:
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

  const id = pickString(r, 'id');
  if (!id) return null;

  const name = pickString(r, 'name') ?? '—';
  // The item code is InventoryItemDTO's `sku`
  const code = pickString(r, 'sku') ?? null;

  const supplierIdStr = pickString(r, 'supplierId');
  const supplierId: string | number | null = supplierIdStr ?? null;

  const supplierName = pickString(r, 'supplierName') ?? null;

  const onHand = pickNumber(r, 'quantity') ?? 0;

  const minQty = pickNumber(r, 'minimumQuantity') ?? null;

  // totalValue falls back to price x onHand
  const price = pickNumber(r, 'price') ?? null;
  const totalValue = pickNumber(r, 'totalValue') ?? (price != null ? price * onHand : null);

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
