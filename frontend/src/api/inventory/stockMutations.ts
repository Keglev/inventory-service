/**
 * @file stockMutations.ts
 * @module api/inventory/stockMutations
 *
 * @summary
 * Stock quantity adjustment mutations for inventory management.
 * Handles inbound purchases, outbound corrections, and inventory adjustments.
 *
 * @enterprise
 * - Purchase-style delta operations (positive/negative quantities)
 * - Business reason tracking for audit trails
 * - Tolerant error handling with boolean returns
 * - PATCH endpoint pattern for partial updates
 */

import http from '../httpClient';
import type { AdjustQuantityRequest } from './types';

/** Centralized endpoint base. */
export const INVENTORY_BASE = '/api/inventory';

/**
 * Adjust item quantity by delta (purchase/correction style).
 * Positive delta = purchase/inbound; negative = correction/outbound.
 *
 * @param req - Adjustment payload with item id, delta, and business reason
 * @returns true if successful, false otherwise
 *
 * @enterprise
 * Server commonly exposes: PATCH /{id}/quantity?delta=&reason=
 * Reasons typically map to business enums (PURCHASE, CORRECTION, WRITE_OFF, RETURN, etc.)
 *
 * @example
 * ```typescript
 * // Record a purchase (inbound)
 * const success = await adjustQuantity({
 *   id: 'ITEM-123',
 *   delta: 50,
 *   reason: 'PURCHASE'
 * });
 *
 * // Record a correction (outbound)
 * const corrected = await adjustQuantity({
 *   id: 'ITEM-123',
 *   delta: -5,
 *   reason: 'CORRECTION'
 * });
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
