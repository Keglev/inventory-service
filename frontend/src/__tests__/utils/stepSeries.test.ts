/**
 * @file stepSeries.test.ts
 * @module tests/utils/stepSeries
 * @testing toStepSeries
 * @description Points get epoch time and sort; points without a valid date drop;
 *   the last value is carried to the range end only when it ends earlier.
 */
import { describe, it, expect } from 'vitest';
import { toStepSeries } from '@/utils/stepSeries';

type P = { date: string; v: number };

describe('toStepSeries', () => {
  it('sorts by time and carries the last value to the range end', () => {
    const series = toStepSeries<P>([{ date: '2026-06-10', v: 2 }, { date: '2026-06-01', v: 1 }], '2026-06-30');
    expect(series).toEqual([
      { date: '2026-06-01', v: 1, t: Date.parse('2026-06-01') },
      { date: '2026-06-10', v: 2, t: Date.parse('2026-06-10') },
      { date: '2026-06-30', v: 2, t: Date.parse('2026-06-30'), carried: true },
    ]);
  });

  it('carries nothing when the last point is on the range end or there is no range end', () => {
    expect(toStepSeries<P>([{ date: '2026-06-30', v: 1 }], '2026-06-30')).toHaveLength(1);
    expect(toStepSeries<P>([{ date: '2026-06-01', v: 1 }])).toHaveLength(1);
  });

  it('drops points without a valid date and handles no data', () => {
    expect(toStepSeries<P>([{ date: 'x', v: 1 }, { v: 2 } as unknown as P], '2026-06-30')).toEqual([]);
    expect(toStepSeries<P>(undefined, '2026-06-30')).toEqual([]);
  });
});
