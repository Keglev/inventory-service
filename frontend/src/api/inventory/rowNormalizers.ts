/**
 * @file rowNormalizers.ts
 * @module api/inventory/rowNormalizers
 *
 * @summary
 * DTO normalization for inventory list rows.
 * Converts raw API responses to strongly-typed InventoryRow shapes.
 * Maps backend fields (id, quantity, minimumQuantity) → frontend fields (itemId, onHand, minQty).
 *
 * @enterprise
 * - Single responsibility: DTO → InventoryRow transformation
 * - Handles backend field name mappings transparently
 * - Type-safe with full TypeScript support
 * - Reusable for both single rows and batch operations
 */

import type { InventoryRow } from './types';
import { pickString, pickNumber } from './utils';

/**
 * Normalize a raw API response object into a strongly-typed InventoryRow.
 * Maps backend fields:
 *  - id → itemId
 *  - quantity → onHand
 *  - minimumQuantity → minQty
 *  - createdAt → updatedAt
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
  const code = pickString(r, 'code') ?? null;

  const supplierIdStr = pickString(r, 'supplierId');
  const supplierId: string | number | null = supplierIdStr ?? null;

  const supplierName = pickString(r, 'supplierName') ?? null;

  // quantity → onHand
  const onHand = pickNumber(r, 'quantity') ?? 0;

  // minimumQuantity → minQty
  const minQty = pickNumber(r, 'minimumQuantity') ?? null;

  // createdAt → updatedAt (for display)
  const updatedAt = pickString(r, 'createdAt') ?? null;

  return {
    id,
    name,
    code,
    supplierId,
    supplierName,
    onHand,
    minQty,
    updatedAt,
  };
};
