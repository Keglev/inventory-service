/**
 * @file priceMutations.ts
 * @module api/inventory/priceMutations
 *
 * @summary
 * Price change mutations for inventory items.
 * Handles item unit price updates with audit trail support.
 *
 * @enterprise
 * - Single-responsibility: focused on price changes only
 * - Tolerant error handling with boolean returns
 * - PATCH endpoint pattern for atomic price updates
 * - URL-safe ID encoding for special characters
 */

import http from '../httpClient';
import type { ChangePriceRequest } from './types';

/** Centralized endpoint base. */
export const INVENTORY_BASE = '/api/inventory';

/**
 * Change item unit price.
 * Updates the unit price for the specified item.
 *
 * @param req - Price change payload with item id and new price
 * @returns true if successful, false otherwise
 *
 * @enterprise
 * Server commonly exposes: PATCH /{id}/price?price=
 * Price validation (minimum/maximum) typically handled by backend.
 *
 * @example
 * ```typescript
 * // Update item price
 * const success = await changePrice({
 *   id: 'ITEM-123',
 *   price: 29.99
 * });
 *
 * if (!success) {
 *   console.error('Price update failed');
 * }
 * ```
 */
export async function changePrice(req: ChangePriceRequest): Promise<boolean> {
  try {
    await http.patch(
      `${INVENTORY_BASE}/${encodeURIComponent(req.id)}/price`,
      null,
      { params: { price: req.price } }
    );
    return true;
  } catch {
    return false;
  }
}
