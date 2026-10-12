/**
 * @file priceSeries.ts
 * @module pages/analytics/blocks/priceSeries
 *
 * @summary
 * Shapes price-trend points for the step chart in PriceTrendCard.
 *
 * @enterprise
 * The API returns one point per recorded price change. A price holds until the
 * next change, so the chart draws steps and repeats the last price at the end of
 * the selected range; otherwise the line would stop at the last change and read
 * as "no price since then". The repeated point is marked so the chart draws no
 * dot on a day without a recorded change.
 */
import type { PricePoint } from '../../../api/analytics/types';

/** A plotted price; `carried` marks the last price repeated at the range end. */
export type ChartPricePoint = PricePoint & { carried?: boolean };

/**
 * Sorts points by date (missing dates first) and carries the last price to `to`.
 *
 * @param points price changes as returned by the API, in any order
 * @param to range end (ISO date); without it, or when the last change is on or after it, nothing is added
 * @returns the series to plot
 */
export function buildPriceSeries(points: readonly PricePoint[] | undefined, to?: string): ChartPricePoint[] {
  const sorted: ChartPricePoint[] = [...(points ?? [])].sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? ''));
  const last = sorted[sorted.length - 1];
  return last && to && last.date < to ? [...sorted, { date: to, price: last.price, carried: true }] : sorted;
}
