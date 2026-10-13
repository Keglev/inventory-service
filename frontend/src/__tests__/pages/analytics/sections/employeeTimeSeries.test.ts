/**
 * @file employeeTimeSeries.test.ts
 * @module __tests__/pages/analytics/sections/employeeTimeSeries
 * @testing Unit tests for the employee activity time axis helpers.
 * @description
 * Contract under test:
 * - bucketStart reads day, ISO week (Monday, also across a year end and a 53rd
 *   week) and month keys as UTC midnights; anything else is null.
 * - employeeTimeRows fills every quiet bucket between the range ends, keeps
 *   the rows that had changes, and falls back to the data ends without a range.
 * - monthTicks keeps every month up to eight, then thins to about six.
 * - utcDay and monthKey turn a bucket start back into a calendar day or month.
 */

import { describe, expect, it } from 'vitest';
import {
  bucketStart,
  employeeTimeRows,
  monthKey,
  monthTicks,
  utcDay,
} from '@/pages/analytics/sections/employeeTimeSeries';

const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

describe('bucketStart', () => {
  it.each([
    ['2026-06-13', '2026-06-13'],
    ['2026-W37', '2026-09-07'],
    ['2026-W01', '2025-12-29'],
    ['2021-W01', '2021-01-04'],
    ['2020-W53', '2020-12-28'],
    ['2026-09', '2026-09-01'],
  ])('reads %s as %s', (key, day) => {
    expect(iso(bucketStart(key) as number)).toBe(day);
  });

  it.each(['2026-W7', 'not-a-key', ''])('returns null for %o', (key) => {
    expect(bucketStart(key)).toBeNull();
  });
});

describe('employeeTimeRows', () => {
  const rows = [
    { period: '2026-W28', 'a@x': 2 },
    { period: '2026-W35', 'a@x': 1 },
  ];

  it('fills the quiet weeks between the range ends with empty rows', () => {
    const out = employeeTimeRows(rows, 'weekly', '2026-07-01', '2026-09-02');

    expect(out.map((r) => iso(r.t))).toEqual([
      '2026-06-29', '2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27',
      '2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31',
    ]);
    expect(out[1]).toMatchObject({ period: '2026-W28', 'a@x': 2 });
    expect(out[2]).toEqual({ period: '', t: Date.UTC(2026, 6, 13) });
  });

  it('spans the data alone when no range is set', () => {
    const out = employeeTimeRows([{ period: '2026-07' }, { period: '2026-09' }], 'monthly');

    expect(out.map((r) => iso(r.t))).toEqual(['2026-07-01', '2026-08-01', '2026-09-01']);
  });

  it('returns nothing without rows or range', () => {
    expect(employeeTimeRows([], 'daily')).toEqual([]);
  });
});

describe('monthTicks', () => {
  it('keeps up to eight months and thins a longer range to about six', () => {
    const months = (n: number) => Array.from({ length: n }, (_, i) => Date.UTC(2026, i, 1));

    expect(monthTicks(months(8))).toHaveLength(8);
    expect(monthTicks(months(12))).toEqual([0, 2, 4, 6, 8, 10].map((m) => Date.UTC(2026, m, 1)));
  });
});

describe('utcDay and monthKey', () => {
  it('turn a bucket start back into its calendar day and month', () => {
    const t = Date.UTC(2026, 8, 7);

    expect(utcDay(t).getDate()).toBe(7);
    expect(utcDay(t).getMonth()).toBe(8);
    expect(monthKey(t)).toBe('2026-09');
  });
});
