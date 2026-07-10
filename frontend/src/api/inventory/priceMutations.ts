/**
 * @module api/inventory/priceMutations
 *
 * Price mutation for inventory items.
 * Hits PATCH /api/inventory/{id}/price to update the unit price for a given item.
 * Returns a structured result ({ ok, error, errorToken, status }) so callers can map failures by status token.
 */

import http from '../httpClient';
import type { ChangePriceRequest, UpsertItemResponse } from './types';
import { INVENTORY_BASE } from '../shared/constants';
import { errorMessage, extractApiError } from '../shared/errorHandling';

export { INVENTORY_BASE };

/**
 * Sends the new unit price to PATCH /api/inventory/{id}/price via query param.
 * The endpoint returns no payload; on failure the response carries the backend
 * status token so the dialog can map it (forbidden, not_found, or generic).
 * Intentionally sends no StockChangeReason — the backend audit helper automatically records
 * a PRICE_CHANGE stock-history entry server-side. Do not add a reason param; the endpoint
 * does not accept one.
 *
 * @param req - Price change payload with item id and new price
 * @returns UpsertItemResponse: { ok: true } on success, otherwise ok:false with error details
 *
 * @example
 * const result = await changePrice({ id: 'ITEM-123', price: 29.99 });
 * if (!result.ok) {
 *   // branch on result.errorToken
 * }
 */
export async function changePrice(req: ChangePriceRequest): Promise<UpsertItemResponse> {
  try {
    await http.patch(
      `${INVENTORY_BASE}/${encodeURIComponent(req.id)}/price`,
      null,
      { params: { price: req.price } }
    );
    return { ok: true };
  } catch (e: unknown) {
    const apiError = extractApiError(e);
    return { ok: false, error: errorMessage(e), errorToken: apiError.token, status: apiError.status };
  }
}
