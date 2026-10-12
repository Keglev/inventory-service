/**
 * @file priceSeries.ts
 * @module pages/analytics/blocks/priceSeries
 *
 * @summary
 * Price axis for the step chart in PriceTrendCard: domain and round ticks.
 * The series comes from utils/stepSeries, the time axis from utils/timeAxis.
 *
 * @enterprise
 * The API returns one point per recorded price change; the step series carries
 * the last price to the range end, and the time axis gives each gap between
 * changes its real width (on a category axis 62 days and 97 days took the same
 * width).
 */
import type { PricePoint } from '../../../api/analytics/types';
import type { StepPoint } from '../../../utils/stepSeries';

/** A plotted price at time `t` (epoch ms); `carried` marks the last price repeated at the range end. */
export type ChartPricePoint = StepPoint<PricePoint>;

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
