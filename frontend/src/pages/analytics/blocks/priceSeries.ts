/**
 * @file priceSeries.ts
 * @module pages/analytics/blocks/priceSeries
 *
 * @summary
 * Shapes price-trend points for the step chart in PriceTrendCard: series on a
 * time scale, the carried last price, and the axis domain and ticks.
 *
 * @enterprise
 * The API returns one point per recorded price change. A price holds until the
 * next change, so the chart draws steps and repeats the last price at the end of
 * the selected range; otherwise the line would stop at the last change and read
 * as "no price since then". The repeated point is marked so the chart draws no
 * dot on a day without a recorded change. Points sit on a time scale: on a
 * category axis 62 days and 97 days took the same width.
 */
import type { PricePoint } from '../../../api/analytics/types';

/** A plotted price at time `t` (epoch ms); `carried` marks the last price repeated at the range end. */
export type ChartPricePoint = PricePoint & { t: number; carried?: boolean };

const DAY_MS = 86_400_000;

/**
 * Builds the series: drops points without a valid date (a time axis cannot place
 * them), sorts by time and carries the last price to `to`.
 *
 * @param points price changes as returned by the API, in any order
 * @param to range end (ISO date); without it, or when the last change is on or after it, nothing is added
 * @returns the series to plot
 */
export function buildPriceSeries(points: readonly PricePoint[] | undefined, to?: string): ChartPricePoint[] {
  const sorted = (points ?? [])
    .map((p) => ({ ...p, t: Date.parse(p?.date ?? '') }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
  const last = sorted[sorted.length - 1];
  const end = to ? Date.parse(to) : NaN;
  return last && last.t < end ? [...sorted, { date: to as string, price: last.price, t: end, carried: true }] : sorted;
}

/**
 * Axis domain spanning the selected range (and every point), with `count` + 1
 * day-aligned ticks spread evenly across it.
 *
 * @param series the plotted series (non-empty)
 * @param from range start (ISO date), optional
 * @param to range end (ISO date), optional
 * @param count number of tick intervals
 * @returns domain and ticks in epoch ms
 */
export function priceTimeAxis(
  series: readonly ChartPricePoint[],
  from?: string,
  to?: string,
  count = 5,
): { domain: [number, number]; ticks: number[] } {
  const ts = series.map((p) => p.t);
  const bounds = [Date.parse(from ?? ''), Date.parse(to ?? '')].filter(Number.isFinite);
  const lo = Math.min(...ts, ...bounds);
  const hi = Math.max(...ts, ...bounds);
  const ticks = Array.from({ length: count + 1 }, (_, i) => Math.round((lo + ((hi - lo) * i) / count) / DAY_MS) * DAY_MS);
  return { domain: [lo, hi], ticks: [...new Set(ticks)] };
}

/**
 * Price axis with a margin of at least 10% above and below the prices, widened
 * to round ticks: the step is 1, 2 or 5 times a power of ten, at least one cent,
 * about four intervals across. A segment at the lowest or highest price then
 * does not sit on the chart border, and the labels read 16,20 / 16,40 rather
 * than 16,36 / 16,51.
 * A flat series gets a margin of 5% of its price (or 1 when the price is 0).
 *
 * @param series the plotted series (non-empty)
 * @returns domain and ticks for the price axis
 */
export function priceValueAxis(series: readonly ChartPricePoint[]): { domain: [number, number]; ticks: number[] } {
  const prices = series.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const pad = max > min ? (max - min) * 0.1 : Math.abs(max) * 0.05 || 1;
  const raw = (max - min + 2 * pad) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(0.01, ([1, 2, 5, 10].find((m) => m * magnitude >= raw) ?? 10) * magnitude);
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  const round = (v: number) => Number(v.toFixed(decimals));
  const lo = round(Math.floor((min - pad) / step) * step);
  const hi = round(Math.ceil((max + pad) / step) * step);
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => round(lo + i * step));
  return { domain: [lo, hi], ticks };
}
