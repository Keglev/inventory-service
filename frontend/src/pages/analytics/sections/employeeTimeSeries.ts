/**
 * @file employeeTimeSeries.ts
 * @module pages/analytics/sections/employeeTimeSeries
 * @summary Places the employee activity buckets on a time axis: each bucket key
 *   becomes its start day (UTC midnight, ms), and periods without changes are
 *   added so a line drops to 0 there instead of skipping them.
 * @enterprise
 * The API returns only periods that had changes, and the chart drew them on a
 * category axis, so seven quiet weeks took the width of one (fork 7 finding 2,
 * Carlos 2026-10-13: option A, a time axis as on the stock activity card). A
 * missing period is a real zero (nobody changed anything), and the chart reads
 * a missing employee as 0 already, so an empty row per missing bucket suffices.
 * Days are UTC midnights like the stock activity series; they are turned back
 * into local calendar days only for display (utcDay).
 */
import type { EmployeeGranularity } from '../../../api/analytics/employees';
import type { EmployeesChartRow } from './useEmployeesSectionData';

const DAY_MS = 86_400_000;

/** A pivoted row placed on the time axis. */
export type EmployeeTimeRow = EmployeesChartRow & { t: number };

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEK = /^(\d{4})-W(\d{2})$/;
const MONTH = /^(\d{4})-(\d{2})$/;

/** Monday of ISO week 1 is the Monday on or before 4 January. */
function isoWeekMonday(year: number, week: number): number {
  const jan4 = Date.UTC(year, 0, 4);
  const daysSinceMonday = (new Date(jan4).getUTCDay() + 6) % 7;
  return jan4 - daysSinceMonday * DAY_MS + (week - 1) * 7 * DAY_MS;
}

/**
 * Start of the bucket a key names ('YYYY-MM-DD', 'YYYY-Www' ISO week, 'YYYY-MM').
 *
 * @returns UTC midnight in ms, or null for an unknown key
 */
export function bucketStart(key: string): number | null {
  const day = DAY.exec(key);
  if (day) return Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]));
  const week = WEEK.exec(key);
  if (week) return isoWeekMonday(Number(week[1]), Number(week[2]));
  const month = MONTH.exec(key);
  if (month) return Date.UTC(Number(month[1]), Number(month[2]) - 1, 1);
  return null;
}

/** Start of the bucket that holds the given UTC day. */
function bucketOf(t: number, granularity: EmployeeGranularity): number {
  const d = new Date(t);
  if (granularity === 'weekly') return t - ((d.getUTCDay() + 6) % 7) * DAY_MS;
  if (granularity === 'monthly') return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
  return t;
}

/** Start of the following bucket. */
function nextBucket(t: number, granularity: EmployeeGranularity): number {
  if (granularity === 'weekly') return t + 7 * DAY_MS;
  if (granularity === 'monthly') {
    const d = new Date(t);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  return t + DAY_MS;
}

/** The local calendar day a UTC-midnight timestamp names (for display). */
export function utcDay(t: number): Date {
  const d = new Date(t);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** 'YYYY-MM' of a UTC-midnight timestamp, for the month label helpers. */
export function monthKey(t: number): string {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** More buckets than this are not filled (a guard; a 2-year daily range has 731). */
const MAX_BUCKETS = 1000;

/**
 * Places rows on the time axis and adds an empty row for every bucket between the
 * range ends (or the data ends, when no range is set) that had no changes.
 *
 * @param rows        pivoted rows, one per period that had changes
 * @param granularity bucket size
 * @param from        range start (ISO day), optional
 * @param to          range end (ISO day), optional
 * @returns rows sorted by t, gaps filled
 */
export function employeeTimeRows(
  rows: readonly EmployeesChartRow[],
  granularity: EmployeeGranularity,
  from?: string,
  to?: string,
): EmployeeTimeRow[] {
  const byStart = new Map<number, EmployeeTimeRow>();
  for (const row of rows) {
    const t = bucketStart(row.period);
    if (t !== null) byStart.set(t, { ...row, t });
  }
  const ends = [from, to].map((d) => bucketStart(d ?? '')).filter((t): t is number => t !== null)
    .map((t) => bucketOf(t, granularity));
  const all = [...byStart.keys(), ...ends];
  if (all.length === 0) return [];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const filled: EmployeeTimeRow[] = [];
  for (let t = lo; t <= hi && filled.length < MAX_BUCKETS; t = nextBucket(t, granularity)) {
    filled.push(byStart.get(t) ?? { period: '', t });
  }
  return filled;
}

/**
 * Ticks at month starts for a monthly axis: every month up to eight, else every
 * n-th month so about six labels remain.
 */
export function monthTicks(times: readonly number[]): number[] {
  if (times.length <= 8) return [...times];
  const step = Math.ceil(times.length / 6);
  return times.filter((_, i) => i % step === 0);
}
