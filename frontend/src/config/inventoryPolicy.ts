/**
 * @file inventoryPolicy.ts
 * @module config/inventoryPolicy
 *
 * @summary
 * Inventory business-rule constants shared across pages.
 *
 * @enterprise
 * - Two distinct rules happen to share the value 5 today; they are named
 *   separately so either can change without silently dragging the other.
 * - LOW_STOCK_CRITICAL_THRESHOLD mirrors the severity rule used by the
 *   analytics LowStockTable and the inventory row styling.
 */

/** Deficit (minQty - onHand) at or above which an item is CRITICAL. */
export const LOW_STOCK_CRITICAL_THRESHOLD = 5;

/** Default minimum quantity applied when none is provided. */
export const DEFAULT_MIN_QUANTITY = 5;
