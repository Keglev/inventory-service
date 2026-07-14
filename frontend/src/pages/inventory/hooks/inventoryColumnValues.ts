/**
 * @file inventoryColumnValues.ts
 * @module pages/inventory/hooks/inventoryColumnValues
 * @summary Pure value resolvers and formatters for the inventory grid columns.
 * @enterprise
 * Extracted from useInventoryColumns so the row-shape tolerance lives apart
 * from the column layout. The grid must accept both normalized rows (onHand,
 * minQty) and raw backend rows (quantity, minimumQuantity, string numerics),
 * because search results and page loads normalize at different points. All
 * functions are pure and defensive: absent or malformed values render as 0,
 * null, or an em-dash instead of crashing a cell. Formatters take the user's number-format
 * preference as an argument so the module stays state-free. Date cells are rendered by the
 * shared formatDateCell in utils/formatters, which the supplier grid uses too.
 */
import type { InventoryRow } from '../../../api/inventory/types';
import { formatNumber } from '../../../utils/formatters';
import type { NumberFormat } from '../../../context/settings/SettingsContext.types';

/** Prefer the normalized onHand count; fall back to the backend quantity field. */
export function resolveOnHand(
  row: (InventoryRow & { quantity?: number | null }) | null
): number {
  if (!row) return 0;
  const fromNormalized =
    typeof row.onHand === 'number' && Number.isFinite(row.onHand) ? row.onHand : undefined;
  const fromBackend =
    typeof row.quantity === 'number' && Number.isFinite(row.quantity) ? row.quantity : undefined;
  return fromNormalized ?? fromBackend ?? 0;
}

/** Accept minQty or backend minimumQuantity, tolerating numeric strings. */
export function resolveMinQty(
  row: (InventoryRow & { minimumQuantity?: number | string | null }) | null
): number {
  if (!row) return 0;
  const raw = row.minQty ?? row.minimumQuantity ?? 0;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/** Unit price or null when absent/malformed (null renders as an em-dash). */
export function resolvePrice(row: InventoryRow | null): number | null {
  if (!row) return null;
  return typeof row.price === 'number' && Number.isFinite(row.price) ? row.price : null;
}

/** Server-computed total; falls back to price x onHand when the backend omits it. */
export function resolveTotalValue(row: InventoryRow | null): number | null {
  if (!row) return null;
  if (typeof row.totalValue === 'number' && Number.isFinite(row.totalValue)) {
    return row.totalValue;
  }
  if (typeof row.price === 'number' && Number.isFinite(row.price)) {
    return row.price * row.onHand;
  }
  return null;
}

/** Counts render as plain integers (no decimal places). */
export function formatCount(value: unknown, numberFormat: NumberFormat): string {
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : 0;
  return formatNumber(Number.isFinite(numeric) ? numeric : 0, numberFormat, 0);
}

/** Currency-style two-decimal rendering; em-dash for absent values. */
export function formatMoney(value: unknown, numberFormat: NumberFormat): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '\u2014';
  return formatNumber(value, numberFormat, 2);
}
