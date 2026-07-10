/**
 * @module api/inventory/stockMutations
 *
 * Quantity-adjustment mutations for inventory items.
 * All stock changes route through PATCH /api/inventory/{id}/quantity so
 * error handling and endpoint encoding are uniform across the app.
 * Returns a structured result ({ ok, error, errorToken, status }) so callers
 * can map failures by backend status token.
 */

import http from '../httpClient';
import type { AdjustQuantityRequest, UpsertItemResponse } from './types';
import { INVENTORY_BASE } from '../shared/constants';
import { errorMessage, extractApiError } from '../shared/errorHandling';

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
 * @returns UpsertItemResponse: { ok: true } on success, otherwise ok:false with error details
 *
 * @example
 * ```typescript
 * // Mark items as sold (outbound)
 * const result = await adjustQuantity({ id: 'ITEM-123', delta: -5, reason: 'SOLD' });
 * if (!result.ok) {
 *   // branch on result.errorToken ('forbidden' | 'not_found' | 'unprocessable_entity' | null)
 * }
 * ```
 */
export async function adjustQuantity(req: AdjustQuantityRequest): Promise<UpsertItemResponse> {
  try {
    await http.patch(
      `${INVENTORY_BASE}/${encodeURIComponent(req.id)}/quantity`,
      null,
      { params: { delta: req.delta, reason: req.reason } }
    );
    return { ok: true };
  } catch (e: unknown) {
    const apiError = extractApiError(e);
    return { ok: false, error: errorMessage(e), errorToken: apiError.token, status: apiError.status };
  }
}
