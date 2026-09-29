/**
 * @file supplierValueSlices.ts
 * @module pages/analytics/blocks/supplierValueSlices
 *
 * @summary
 * Turns the per-supplier stock values into the slices of the value pie: every
 * supplier when there are few, otherwise the top four and one "all others".
 *
 * @enterprise
 * - Pure and synchronous, so the grouping rule is tested without rendering.
 * - Owner's rules (2026-09-28): value, not pieces; at most five slices; the
 *   "all others" slice groups everything after the top four even when it is
 *   bigger than any of them; suppliers without value are left out; equal
 *   values are ordered by name so the top four do not flicker.
 * - The API already sorts this way; sorting again keeps the rule in one place
 *   for the chart instead of trusting the order of the payload.
 */
import type { StockPerSupplierPoint } from '../../../api/analytics/types';

/** Suppliers shown by name before the rest are grouped. */
export const TOP_SUPPLIERS = 4;

/** One pie slice; `others` counts the suppliers grouped into the last slice. */
export type SupplierValueSlice =
  | { kind: 'supplier'; name: string; value: number }
  | { kind: 'others'; value: number; others: number };

export function supplierValueSlices(points: StockPerSupplierPoint[]): SupplierValueSlice[] {
  const ranked = points
    .filter((p) => p.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue || a.supplierName.localeCompare(b.supplierName));

  // Five suppliers fit as five named slices; grouping one supplier alone
  // under "all others" would only hide its name.
  if (ranked.length <= TOP_SUPPLIERS + 1) {
    return ranked.map((p) => ({ kind: 'supplier', name: p.supplierName, value: p.totalValue }));
  }

  const rest = ranked.slice(TOP_SUPPLIERS);
  return [
    ...ranked.slice(0, TOP_SUPPLIERS).map((p): SupplierValueSlice =>
      ({ kind: 'supplier', name: p.supplierName, value: p.totalValue })),
    { kind: 'others', value: rest.reduce((sum, p) => sum + p.totalValue, 0), others: rest.length },
  ];
}
