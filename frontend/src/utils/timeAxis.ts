/**
 * @file timeAxis.ts
 * @module utils/timeAxis
 *
 * @summary
 * Domain and day-aligned ticks for a Recharts time axis (XAxis type="number"
 * scale="time") over a selected date range.
 *
 * @enterprise
 * Shared by the price trend and the stock activity chart. On a category axis
 * every point took the same width whatever lay between them; on a time axis
 * the gap between two points shows the time that passed.
 */

const DAY_MS = 86_400_000;

/**
 * Axis domain spanning the selected range (and every point), with `count` + 1
 * day-aligned ticks spread evenly across it.
 *
 * @param times point times in epoch ms (non-empty)
 * @param from range start (ISO date), optional
 * @param to range end (ISO date), optional
 * @param count number of tick intervals
 * @returns domain and ticks in epoch ms
 */
export function dayTimeAxis(
  times: readonly number[],
  from?: string,
  to?: string,
  count = 5,
): { domain: [number, number]; ticks: number[] } {
  const bounds = [Date.parse(from ?? ''), Date.parse(to ?? '')].filter(Number.isFinite);
  const lo = Math.min(...times, ...bounds);
  const hi = Math.max(...times, ...bounds);
  const ticks = Array.from({ length: count + 1 }, (_, i) => Math.round((lo + ((hi - lo) * i) / count) / DAY_MS) * DAY_MS);
  return { domain: [lo, hi], ticks: [...new Set(ticks)] };
}
