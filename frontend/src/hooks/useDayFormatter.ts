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

/** @returns a formatter for axis ticks and tooltip labels */
export function useDayFormatter(): (value: unknown) => string {
  const { userPreferences } = useSettings();
  return useCallback(
    (value: unknown) => formatDate(typeof value === 'number' ? new Date(value) : String(value), userPreferences.dateFormat) || String(value),
    [userPreferences.dateFormat]
  );
}
