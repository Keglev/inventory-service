/**
 * @file monthLabels.test.ts
 * @module tests/utils/monthLabels
 * @testing monthLabel, monthSpanLabel
 * @description Month buckets get a short axis label in the UI language; the tooltip
 *   label names the covered dates only when the range cuts the month, in the user's
 *   date format. Keys that are not "YYYY-MM" pass through unchanged.
 */
import { describe, it, expect } from 'vitest';
import { monthLabel, monthSpanLabel } from '@/utils/monthLabels';

describe('monthLabel', () => {
  it('names the month in the UI language', () => {
    expect(monthLabel('2026-04', 'de')).toBe('Apr. 2026');
    expect(monthLabel('2026-04', 'en')).toBe('Apr 2026');
  });

  it('returns keys that are not a month bucket unchanged', () => {
    expect(monthLabel('2026-W37', 'de')).toBe('2026-W37');
    expect(monthLabel('2026-13', 'de')).toBe('2026-13');
  });
});

describe('monthSpanLabel', () => {
  const de = { lang: 'de', dateFormat: 'DD.MM.YYYY' as const };

  it('gives the bare month name when the range covers the whole month', () => {
    expect(monthSpanLabel('2026-05', { ...de, from: '2026-04-15', to: '2026-10-12' })).toBe('Mai 2026');
    expect(monthSpanLabel('2026-05', de)).toBe('Mai 2026');
  });

  it('adds the covered dates when the range starts inside the month', () => {
    expect(monthSpanLabel('2026-04', { ...de, from: '2026-04-15', to: '2026-10-12' })).toBe(
      'April 2026 (15.04.2026 – 30.04.2026)',
    );
  });

  it('adds the covered dates when the range ends inside the month, in the user date format', () => {
    expect(monthSpanLabel('2026-10', { ...de, from: '2026-04-15', to: '2026-10-12' })).toBe(
      'Oktober 2026 (01.10.2026 – 12.10.2026)',
    );
    expect(
      monthSpanLabel('2026-10', { lang: 'en', dateFormat: 'YYYY-MM-DD', from: '2026-04-15', to: '2026-10-12' }),
    ).toBe('October 2026 (2026-10-01 – 2026-10-12)');
  });

  it('names both ends when the range lies inside one month', () => {
    expect(monthSpanLabel('2026-02', { ...de, from: '2026-02-03', to: '2026-02-10' })).toBe(
      'Februar 2026 (03.02.2026 – 10.02.2026)',
    );
  });

  it('returns keys that are not a month bucket unchanged', () => {
    expect(monthSpanLabel('2026-09-09', de)).toBe('2026-09-09');
  });
});
