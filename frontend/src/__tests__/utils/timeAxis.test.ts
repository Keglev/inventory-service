/**
 * @file timeAxis.test.ts
 * @module tests/utils/timeAxis
 * @testing dayTimeAxis
 * @description The domain covers the selected range and every point; ticks are
 *   day-aligned, evenly spread and never repeated.
 */
import { describe, it, expect } from 'vitest';
import { dayTimeAxis, timeXAxisProps } from '@/utils/timeAxis';

const DAY = 86_400_000;
const at = (iso: string) => Date.parse(iso);

describe('dayTimeAxis', () => {
  it('spans the selected range with count + 1 day-aligned ticks', () => {
    const { domain, ticks } = dayTimeAxis([at('2026-05-01')], '2026-04-16', '2026-10-12');
    expect(domain).toEqual([at('2026-04-16'), at('2026-10-12')]);
    expect(ticks).toHaveLength(6);
    expect([ticks[0], ticks.at(-1)]).toEqual(domain);
    expect(ticks.every((t) => t % DAY === 0)).toBe(true);
  });

  it('widens the domain to points outside the range', () => {
    const { domain } = dayTimeAxis([at('2026-04-13'), at('2026-10-20')], '2026-04-15', '2026-10-12');
    expect(domain).toEqual([at('2026-04-13'), at('2026-10-20')]);
  });

  it('uses the points alone without a range, and drops repeated ticks', () => {
    const { domain, ticks } = dayTimeAxis([at('2026-06-01'), at('2026-06-03')], undefined, 'not-a-date', 4);
    expect(domain).toEqual([at('2026-06-01'), at('2026-06-03')]);
    expect(ticks).toEqual([at('2026-06-01'), at('2026-06-02'), at('2026-06-03')]);
  });
});

describe('timeXAxisProps', () => {
  it('keys points by t on a time scale with the axis domain and ticks', () => {
    const format = (v: unknown) => String(v);
    expect(timeXAxisProps({ domain: [1, 2], ticks: [1, 2] }, format)).toEqual({
      dataKey: 't', type: 'number', scale: 'time', domain: [1, 2], ticks: [1, 2], tickFormatter: format,
    });
    expect(timeXAxisProps(null, format)).toMatchObject({ domain: undefined, ticks: undefined });
  });
});
