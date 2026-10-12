/**
 * @file stepSeries.ts
 * @module utils/stepSeries
 *
 * @summary
 * Prepares dated points for a step line on a time axis: epoch time, sorted, and
 * the last value carried to the end of the selected range.
 *
 * @enterprise
 * A value that holds until it changes (a price, a stock value) is drawn as a
 * step (stepAfter). The data has one point per change, so without the carried
 * point the line would stop at the last change and read as "no value since
 * then". The carried point is marked so the chart draws no dot on a day
 * without a change. Shared by the price trend and the stock value chart.
 */

/** A dated point at time `t` (epoch ms); `carried` marks the last value repeated at the range end. */
export type StepPoint<T> = T & { t: number; carried?: boolean };

/**
 * Drops points without a valid date (a time axis cannot place them), sorts by
 * time and carries the last value to `to`.
 *
 * @param points dated points in any order
 * @param to range end (ISO date); without it, or when the last point is on or after it, nothing is added
 * @returns the series to plot
 */
export function toStepSeries<T extends { date: string }>(points: readonly T[] | undefined, to?: string): StepPoint<T>[] {
  const sorted = (points ?? [])
    .map((p) => ({ ...p, t: Date.parse(p?.date ?? '') }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
  const last = sorted[sorted.length - 1];
  const end = to ? Date.parse(to) : NaN;
  return last && last.t < end ? [...sorted, { ...last, date: to as string, t: end, carried: true }] : sorted;
}
