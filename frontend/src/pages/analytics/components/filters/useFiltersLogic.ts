/**
 * @file useFiltersLogic.ts
 * @module pages/analytics/components/filters/useFiltersLogic
 *
 * @summary
 * Pure helpers and a small hook for the analytics filter panel: ISO date
 * parsing/formatting, quick-range computation, and date-order validation.
 *
 * @enterprise
 * - All dates are normalized to UTC so that "last 30 days" yields the
 *   same window regardless of the browser timezone.
 * - Date range is inclusive (`from <= to`); equal bounds are valid (a
 *   single-day window).
 * - Quick presets are computed against the current UTC day, not local
 *   midnight, so day-boundary edge cases are deterministic.
 */

import { useMemo } from 'react';

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Parse ISO date string (YYYY-MM-DD) to Date object
 * @param isoDate ISO date string or undefined
 * @returns Parsed Date or undefined
 */
export function parseIsoDate(isoDate?: string): Date | undefined {
  if (!isoDate) return undefined;
  const date = new Date(isoDate + 'T00:00:00Z');
  return !Number.isNaN(date.getTime()) ? date : undefined;
}

/**
 * Format Date to ISO YYYY-MM-DD
 */
export function formatToIsoDate(date?: Date): string | undefined {
  if (!date) return undefined;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get date range bounds based on quick selector
 * @param quickDays 30, 90, or 180 days
 * @returns {from, to} date pair
 */
export function getQuickDateRange(quickDays: number): DateRange {
  const to = new Date();
  // Set to start of day (UTC)
  to.setUTCHours(0, 0, 0, 0);

  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - quickDays);

  return { from, to };
}

/**
 * Validate date range logic
 */
export function validateDateRange(from?: Date, to?: Date): boolean {
  if (!from || !to) return true;
  return from <= to;
}

/**
 * Hook: Memoized date validation
 */
export function useDateValidation(fromDate?: Date, toDate?: Date) {
  return useMemo(() => validateDateRange(fromDate, toDate), [fromDate, toDate]);
}
