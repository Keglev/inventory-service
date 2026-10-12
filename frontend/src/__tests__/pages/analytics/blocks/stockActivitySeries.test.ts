/**
 * @file stockActivitySeries.test.ts
 * @module tests/pages/analytics/blocks/stockActivitySeries
 * @testing activityBucket, buildActivitySeries
 * @description Reason codes map to signed totals per UTC day or week; rows without
 *   a quantity change or a valid timestamp are skipped. Sibling:
 *   RecentStockActivitycard.test.tsx (the chart).
 */
import { describe, it, expect } from 'vitest';
import type { StockUpdateRow } from '@/api/analytics/updates';
import { activityBucket, buildActivitySeries } from '@/pages/analytics/blocks/stockActivitySeries';

const row = (timestamp: string, reason: string | undefined, delta: number): StockUpdateRow => ({ timestamp, itemName: 'X', reason, delta });
const day = (iso: string) => Date.parse(iso);

describe('activityBucket', () => {
  it('groups by day up to 62 days and by week beyond', () => {
    expect(activityBucket('2026-08-11', '2026-10-12')).toBe('day'); // 62 days
    expect(activityBucket('2026-08-10', '2026-10-12')).toBe('week'); // 63 days
  });

  it('groups by day when the range is incomplete', () => {
    expect(activityBucket(undefined, '2026-10-12')).toBe('day');
  });
});

describe('buildActivitySeries', () => {
  it('maps every quantity reason to its kind and keeps the sign', () => {
    const { days } = buildActivitySeries([
      row('2026-06-01T08:00:00Z', 'INITIAL_STOCK', 10),
      row('2026-06-01T08:00:00Z', 'MANUAL_UPDATE', 4),
      row('2026-06-01T08:00:00Z', 'RETURNED_BY_CUSTOMER', 2),
      row('2026-06-01T08:00:00Z', 'SOLD', -5),
      row('2026-06-01T08:00:00Z', 'RETURNED_TO_SUPPLIER', -3),
      ...['SCRAPPED', 'DESTROYED', 'DAMAGED', 'EXPIRED', 'LOST'].map((r) => row('2026-06-01T09:00:00Z', r, -1)),
    ]);
    expect(days).toEqual([
      { t: day('2026-06-01'), initialStock: 10, adjustment: 4, returnIn: 2, sale: -5, returnOut: -3, writeOff: -5 },
    ]);
  });

  it('lists the kinds present in stack order', () => {
    const { keys } = buildActivitySeries([
      row('2026-06-01T08:00:00Z', 'SOLD', -5),
      row('2026-06-01T08:00:00Z', 'NEW_CODE', 1),
      row('2026-06-01T08:00:00Z', 'LOST', -1),
      row('2026-06-01T08:00:00Z', 'INITIAL_STOCK', 3),
      row('2026-06-01T08:00:00Z', 'RETURNED_BY_CUSTOMER', 2),
    ]);
    expect(keys).toEqual(['returnIn', 'initialStock', 'sale', 'writeOff', 'other']);
  });

  it('nets a correction in both directions on one day', () => {
    const { days } = buildActivitySeries([row('2026-06-01T08:00:00Z', 'MANUAL_UPDATE', 5), row('2026-06-01T09:00:00Z', 'MANUAL_UPDATE', -3)]);
    expect(days).toEqual([{ t: day('2026-06-01'), adjustment: 2 }]);
  });

  it('skips rows without a quantity change or a valid timestamp, and files an unknown or missing code as other', () => {
    const { days, keys } = buildActivitySeries([
      row('2026-06-01T08:00:00Z', 'PRICE_CHANGE', 0),
      row('not-a-date', 'SOLD', -5),
      { itemName: 'X', delta: -5, reason: 'SOLD' } as unknown as StockUpdateRow,
      row('2026-06-02T08:00:00Z', undefined, 2),
      row('2026-06-02T09:00:00Z', 'NEW_CODE', 1),
    ]);
    expect(days).toEqual([{ t: day('2026-06-02'), other: 3 }]);
    expect(keys).toEqual(['other']);
  });

  it('buckets by UTC day and sorts the days', () => {
    const { days } = buildActivitySeries([row('2026-06-02T00:30:00+02:00', 'SOLD', -1), row('2026-06-02T23:30:00Z', 'SOLD', -2)]);
    expect(days.map((d) => [d.t, d.sale])).toEqual([[day('2026-06-01'), -1], [day('2026-06-02'), -2]]);
  });

  it('buckets by the UTC week starting Monday', () => {
    // 2026-06-08 is a Monday; 2026-06-14 the Sunday of that week.
    const { days } = buildActivitySeries(
      [row('2026-06-07T12:00:00Z', 'SOLD', -1), row('2026-06-08T00:00:00Z', 'SOLD', -2), row('2026-06-14T23:59:00Z', 'SOLD', -4)],
      'week',
    );
    expect(days).toEqual([{ t: day('2026-06-01'), sale: -1 }, { t: day('2026-06-08'), sale: -6 }]);
  });

  it('returns nothing without data', () => {
    expect(buildActivitySeries(undefined)).toEqual({ days: [], keys: [] });
  });
});
