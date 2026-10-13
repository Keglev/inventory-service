/**
 * @file periodKeys.test.ts
 * @module tests/utils/periodKeys
 * @testing Unit tests for parseDayOrWeekKey.
 * @description
 * Contract under test:
 * - A daily key is that local calendar day.
 * - A weekly key is the Monday of its ISO-8601 week, including weeks whose
 *   Monday falls in the previous year and a 53rd week.
 * - Monthly and unknown keys are not day or week buckets.
 */

import { describe, expect, it } from 'vitest';
import { parseDayOrWeekKey } from '@/utils/periodKeys';

const ymd = (d: Date | undefined) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : null;

describe('parseDayOrWeekKey', () => {
  it('reads a daily key as that local day', () => {
    const bucket = parseDayOrWeekKey('2026-06-13');
    expect(bucket?.kind).toBe('day');
    expect(ymd(bucket?.start)).toBe('2026-06-13');
  });

  it.each([
    ['2026-W37', '2026-09-07'],
    ['2026-W01', '2025-12-29'],
    ['2021-W01', '2021-01-04'],
    ['2020-W53', '2020-12-28'],
  ])('reads weekly key %s as the Monday %s', (key, monday) => {
    const bucket = parseDayOrWeekKey(key);
    expect(bucket?.kind).toBe('week');
    expect(ymd(bucket?.start)).toBe(monday);
    expect(bucket?.start.getDay()).toBe(1);
  });

  it.each(['2026-06', '2026-W7', 'not-a-key', ''])('returns null for %o', (key) => {
    expect(parseDayOrWeekKey(key)).toBeNull();
  });
});
