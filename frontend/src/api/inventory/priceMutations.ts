/**
 * @module api/inventory/priceMutations
 *
 * Price mutation for inventory items.
 * Hits PATCH /api/inventory/{id}/price to update the unit price for a given item.
 * Returns a boolean because the endpoint has no meaningful response payload.
 */

import http from '../httpClient';
import type { ChangePriceRequest } from './types';

/** Centralized endpoint base. */
export const INVENTORY_BASE = '/api/inventory';

/**
 * Sends the new unit price to PATCH /api/inventory/{id}/price via query param.
 * Returns a boolean rather than a structured response because the endpoint returns no payload.
 * Intentionally sends no StockChangeReason — the backend audit helper automatically records
 * a PRICE_CHANGE stock-history entry server-side. Do not add a reason param; the endpoint
 * does not accept one.
 *
 * @param req - Price change payload with item id and new price
 * @returns true if successful, false otherwise
 *
 * @example
 * ```typescript
 * const success = await changePrice({
 *   id: 'ITEM-123',
 *   price: 29.99
 * });
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
