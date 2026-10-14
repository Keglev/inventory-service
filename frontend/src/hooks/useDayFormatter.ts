/**
 * @file useDayFormatter.ts
 * @module hooks/useDayFormatter
 *
 * @summary
 * Formats a chart's day value in the user's date format: epoch ms from a time
 * axis, or an ISO date string.
 *
 * @enterprise
 * The time-axis charts (price trend, stock value, stock activity) each built
 * this formatter (P-R4). A value that is not a date comes back unchanged, so
 * a stray label never renders as an empty string.
 */
import { useCallback } from 'react';
import { useSettings } from './useSettings';
import { formatDate } from '../utils/formatters';

// Time-axis values are UTC midnights (Date.parse of an ISO day). Local getters
// would read the previous day west of UTC (LO-4), so the UTC day is rebuilt as
// a local date first, as utcDay does for the employee chart.
function localDayOf(ms: number): Date {
  const d = new Date(ms);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** @returns a formatter for axis ticks and tooltip labels */
export function useDayFormatter(): (value: unknown) => string {
  const { userPreferences } = useSettings();
  return useCallback(
    (value: unknown) => formatDate(typeof value === 'number' ? localDayOf(value) : String(value), userPreferences.dateFormat) || String(value),
    [userPreferences.dateFormat]
  );
}
