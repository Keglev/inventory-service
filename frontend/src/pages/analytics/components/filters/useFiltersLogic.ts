/**
 * @file useFiltersLogic.ts
 * @module pages/analytics/components/filters/useFiltersLogic
 *
 * @summary
 * Pure helpers for the analytics filter panel: ISO date parsing/formatting,
 * quick-range computation, and date-order validation.
 *
 * @enterprise
 * - A Date here carries a calendar day at UTC midnight: parseIsoDate and
 *   formatToIsoDate round-trip YYYY-MM-DD without the browser offset.
 * - Date range is inclusive (`from <= to`); equal bounds are valid (a
 *   single-day window).
 * - Quick presets end on the LOCAL day, like the page's default window
 *   (utils/formatters getTodayIso, FO3 fork 5 A). They used the UTC day,
 *   which is still yesterday between local midnight and UTC midnight
 *   (00:00-02:00 in Berlin summer time), so a preset moved the window back
 *   one day against the default.
 */

import { getDaysAgoIso, getTodayIso } from '../../../../utils/formatters';

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
 * @returns {from, to} date pair: today's local day and the local day
 *   `quickDays` earlier, each at UTC midnight
 */
export function getQuickDateRange(quickDays: number): DateRange {
  const atUtcMidnight = (isoDay: string) => new Date(`${isoDay}T00:00:00Z`);
  return { from: atUtcMidnight(getDaysAgoIso(quickDays)), to: atUtcMidnight(getTodayIso()) };
}

/**
 * Validate date range logic
 */
export function validateDateRange(from?: Date, to?: Date): boolean {
  if (!from || !to) return true;
  return from <= to;
}
