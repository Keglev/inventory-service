/**
 * @file reasonLabels.ts
 * @module pages/analytics/sections/reasonLabels
 *
 * @summary
 * Single source for the 11 StockChangeReason enum values on the analytics
 * side and their typed i18n label lookup. Unknown backend values fall back
 * to the raw string instead of a broken key, so a future enum addition
 * degrades gracefully until the locale files catch up.
 */
import type { TFunction } from 'i18next';

/** The 11 backend StockChangeReason enum values (LOCKED backend fact). */
export const STOCK_CHANGE_REASONS = [
  'INITIAL_STOCK',
  'MANUAL_UPDATE',
  'PRICE_CHANGE',
  'SOLD',
  'SCRAPPED',
  'DESTROYED',
  'DAMAGED',
  'EXPIRED',
  'LOST',
  'RETURNED_TO_SUPPLIER',
  'RETURNED_BY_CUSTOMER',
] as const;

export type StockChangeReasonKey = (typeof STOCK_CHANGE_REASONS)[number];

/** Type guard narrowing an arbitrary backend string to a known reason. */
export function isStockChangeReason(value: string): value is StockChangeReasonKey {
  return (STOCK_CHANGE_REASONS as readonly string[]).includes(value);
}

/**
 * Translated label for a reason value; raw value for unknown reasons.
 *
 * @param t      translation function bound to the 'analytics' namespace
 * @param reason backend reason string
 */
export function reasonLabel(t: TFunction<['analytics']>, reason: string): string {
  return isStockChangeReason(reason) ? t(`analytics:reasons.${reason}`) : reason;
}
