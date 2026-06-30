/**
 * @module api/inventory/stockMutations
 *
 * Quantity-adjustment mutations for inventory items.
 * All stock changes route through PATCH /api/inventory/{id}/quantity so
 * error handling and endpoint encoding are uniform across the app.
 */

import http from '../httpClient';
import type { AdjustQuantityRequest } from './types';
import { INVENTORY_BASE } from '@/api/shared';

export { INVENTORY_BASE };

/**
 * Records a stock quantity change via PATCH /api/inventory/{id}/quantity.
 * Centralises all stock mutations so callers get uniform error handling
 * without catching HTTP errors themselves.
 *
 * Positive delta = inbound; negative = outbound.
 * `reason` must be one of the 11 backend StockChangeReason values:
 * INITIAL_STOCK, MANUAL_UPDATE, PRICE_CHANGE, SOLD, SCRAPPED, DESTROYED,
 * DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER, RETURNED_BY_CUSTOMER.
 *
 * @param req - Adjustment payload with item id, delta, and business reason
 * @returns true if the server accepted the adjustment, false on any error
 *
 * @example
 * ```typescript
 * // Mark items as sold (outbound)
 * const ok = await adjustQuantity({ id: 'ITEM-123', delta: -5, reason: 'SOLD' });
 *
 * // Inbound manual correction
 * const ok = await adjustQuantity({ id: 'ITEM-123', delta: 50, reason: 'MANUAL_UPDATE' });
 * ```
 */
export async function adjustQuantity(req: AdjustQuantityRequest): Promise<boolean> {
  try {
    await http.patch(
      `${INVENTORY_BASE}/${encodeURIComponent(req.id)}/quantity`,
      null,
      { params: { delta: req.delta, reason: req.reason } }
    );
    return true;
  } catch {
    return false;
  }
}
