/**
 * @file inventoryPolicy.ts
 * @module config/inventoryPolicy
 *
 * @summary
 * Low-stock severity, shared by the inventory row styling and the analytics
 * low-stock table (frontend ADR-0012).
 *
 * @enterprise
 * - Whether an item is low is the backend's rule (quantity below the item's
 *   minimum). This module decides only how severe a low item looks.
 * - Severity is a proportion of the item's own minimum, so the bands mean the
 *   same for every item: critical at half the minimum or less.
 */

/** Visual severity of an item's stock against its minimum. */
export type LowStockSeverity = 'critical' | 'warning' | 'none';

/**
 * Severity of a quantity against the item's minimum.
 *
 * - critical: at or below half the minimum
 * - warning: above half the minimum and below the minimum
 * - none: at or above the minimum, or when either value is missing or the
 *   minimum is not positive (the backend always sends a positive minimum)
 *
 * `2 * quantity <= minimum` keeps the test in integers, so an odd minimum
 * rounds towards warning: minimum 25 is critical at 12 and warning at 13.
 *
 * @param quantity - Stock on hand
 * @param minimum - The item's minimum quantity
 * @returns The severity band
 */
export function lowStockSeverity(quantity: number, minimum: number): LowStockSeverity {
  if (!Number.isFinite(quantity) || !Number.isFinite(minimum) || minimum <= 0) return 'none';
  if (2 * quantity <= minimum) return 'critical';
  if (quantity < minimum) return 'warning';
  return 'none';
}

/** Probe for the required-check experiment. Reverted with the branch. */
export function probeAny(value: any): string {
  return String(value);
}
