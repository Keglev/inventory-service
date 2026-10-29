/**
 * @file stockActivitySeries.ts
 * @module pages/analytics/blocks/stockActivitySeries
 *
 * @summary
 * Groups stock updates into one signed total per UTC day and activity kind for
 * the bar chart in RecentStockActivityCard.
 *
 * @enterprise
 * - Totals keep their sign: stock in stacks above zero, stock out below. With
 *   absolute values, 40 pieces sold and 40 pieces received looked the same.
 * - Each reason code maps to one kind, named like the reason labels elsewhere
 *   (INITIAL_STOCK is "Anfangsbestand", not "Einkaeufe"). Returns are split by
 *   direction, and LOST counts as a write-off, as in the financial summary.
 * - A row without a quantity change (PRICE_CHANGE) adds nothing to a stock
 *   chart and is skipped; an unknown code with a quantity goes to "other".
 * - A correction (MANUAL_UPDATE) can go either way, so a day with both shows
 *   its net change.
 * - Buckets are UTC days, or UTC weeks from Monday for ranges over
 *   WEEKLY_AFTER_DAYS days: on a time axis, 180 days left a day bar about
 *   3 px wide. UTC keeps the buckets from shifting with the browser timezone.
 */
import type { StockUpdateRow } from '../../../api/analytics/updates';

export type ActivityKey = 'returnIn' | 'initialStock' | 'adjustment' | 'sale' | 'returnOut' | 'writeOff' | 'other';

/**
 * Stack order, from zero outwards: Recharts stacks series in this order, and
 * neighbouring segments get colours that stay distinct in both themes.
 */
const ACTIVITY_STACK_ORDER: readonly ActivityKey[] = [
  'returnIn', 'initialStock', 'adjustment', 'sale', 'returnOut', 'writeOff', 'other',
];

/** Legend and tooltip order: stock in, then stock out. */
export const ACTIVITY_LEGEND_ORDER: readonly ActivityKey[] = [
  'initialStock', 'adjustment', 'returnIn', 'sale', 'writeOff', 'returnOut', 'other',
];

const KIND_BY_REASON: Readonly<Record<string, ActivityKey>> = {
  INITIAL_STOCK: 'initialStock',
  MANUAL_UPDATE: 'adjustment',
  SOLD: 'sale',
  SCRAPPED: 'writeOff',
  DESTROYED: 'writeOff',
  DAMAGED: 'writeOff',
  EXPIRED: 'writeOff',
  LOST: 'writeOff',
  RETURNED_BY_CUSTOMER: 'returnIn',
  RETURNED_TO_SUPPLIER: 'returnOut',
};

/** One bar group: the bucket start `t` (epoch ms, UTC midnight) and a signed total per kind present in it. */
export type ActivityDay = { t: number } & Partial<Record<ActivityKey, number>>;

export type ActivityBucket = 'day' | 'week';

/** Ranges longer than this many days are grouped by week. */
const WEEKLY_AFTER_DAYS = 62;

const DAY_MS = 86_400_000;

/**
 * @param from range start (ISO date)
 * @param to range end (ISO date)
 * @returns 'week' when the range spans more than WEEKLY_AFTER_DAYS days, otherwise 'day'
 */
export function activityBucket(from?: string, to?: string): ActivityBucket {
  const span = (Date.parse(to ?? '') - Date.parse(from ?? '')) / DAY_MS;
  return span > WEEKLY_AFTER_DAYS ? 'week' : 'day';
}

/**
 * @param updates stock updates as returned by the API, in any order
 * @param bucket group by UTC day or by UTC week starting Monday
 * @returns buckets sorted by time, and the kinds present in stack order
 */
export function buildActivitySeries(
  updates: readonly StockUpdateRow[] | undefined,
  bucket: ActivityBucket = 'day',
): { days: ActivityDay[]; keys: ActivityKey[] } {
  const byBucket = new Map<number, ActivityDay>();
  const present = new Set<ActivityKey>();

  for (const update of updates ?? []) {
    const time = Date.parse(update.timestamp ?? '');
    if (!Number.isFinite(time) || !update.delta) continue;
    const dayIndex = Math.floor(time / DAY_MS);
    // Epoch day 0 was a Thursday: (dayIndex + 3) % 7 days back is Monday.
    const t = (bucket === 'week' ? dayIndex - ((dayIndex + 3) % 7) : dayIndex) * DAY_MS;
    const key = KIND_BY_REASON[update.reason ?? ''] ?? 'other';
    const group = byBucket.get(t) ?? { t };
    group[key] = (group[key] ?? 0) + update.delta;
    byBucket.set(t, group);
    present.add(key);
  }

  return {
    days: [...byBucket.values()].sort((a, b) => a.t - b.t),
    keys: ACTIVITY_STACK_ORDER.filter((key) => present.has(key)),
  };
}
