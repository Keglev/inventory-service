/**
 * @file periodKeys.ts
 * @module utils/periodKeys
 * @summary Reads the bucket keys the analytics API returns per granularity:
 *   'YYYY-MM-DD' (day), 'YYYY-Www' (ISO week) and 'YYYY-MM' (month).
 * @enterprise
 * The employee activity endpoint names its buckets with these strings rather
 * than dates, so a chart must turn each key back into a calendar day before it
 * can honour the user's date format. Days are built from local getters: a key
 * names a calendar day, never an instant.
 */

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEK = /^(\d{4})-W(\d{2})$/;

/** The bucket a key names, or null for anything else (months included). */
export type PeriodKey = { kind: 'day' | 'week'; start: Date };

/**
 * Monday of an ISO-8601 week. Week 1 is the week that holds 4 January, so
 * its Monday can fall in the previous December.
 */
function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const daysSinceMonday = (jan4.getDay() + 6) % 7;
  return new Date(year, 0, 4 - daysSinceMonday + (week - 1) * 7);
}

/**
 * Parses a daily or weekly bucket key.
 *
 * @param key bucket key from the API
 * @returns the bucket kind and its first day, or null when the key is neither
 */
export function parseDayOrWeekKey(key: string): PeriodKey | null {
  const day = DAY.exec(key);
  if (day) return { kind: 'day', start: new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) };
  const week = WEEK.exec(key);
  if (week) return { kind: 'week', start: isoWeekMonday(Number(week[1]), Number(week[2])) };
  return null;
}
