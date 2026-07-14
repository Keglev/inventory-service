/**
 * @file useFiltersLogic.test.ts
 * @module __tests__/components/pages/analytics/useFiltersLogic
 * @description Pure date helpers and the memoized validation hook behind
 * the analytics filter panel.
 *
 * Contract under test:
 * - parseIsoDate: undefined and unparseable input degrade to undefined;
 *   valid ISO strings parse as UTC midnight.
 * - formatToIsoDate: undefined passes through; Dates render as YYYY-MM-DD
 *   in UTC with zero padding.
 * - getQuickDateRange: inclusive window ending at the current UTC day.
 * - validateDateRange: open-ended ranges are valid; from <= to inclusive.
 * - useDateValidation: memoized wrapper mirrors validateDateRange.
 */
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import {
  parseIsoDate,
  formatToIsoDate,
  getQuickDateRange,
  validateDateRange,
  useDateValidation,
} from '../../../../pages/analytics/components/filters/useFiltersLogic';

describe('parseIsoDate', () => {
  it('returns undefined for missing input', () => {
    expect(parseIsoDate(undefined)).toBeUndefined();
    expect(parseIsoDate('')).toBeUndefined();
  });

  it('returns undefined for unparseable input', () => {
    expect(parseIsoDate('not-a-date')).toBeUndefined();
  });

  it('parses a valid ISO date at UTC midnight', () => {
    const parsed = parseIsoDate('2026-05-01');

    expect(parsed?.toISOString()).toBe('2026-05-01T00:00:00.000Z');
  });
});

describe('formatToIsoDate', () => {
  it('passes undefined through', () => {
    expect(formatToIsoDate(undefined)).toBeUndefined();
  });

  it('formats with zero padding in UTC', () => {
    expect(formatToIsoDate(new Date(Date.UTC(2026, 4, 1)))).toBe('2026-05-01');
  });
});

describe('getQuickDateRange', () => {
  it('spans the requested number of days ending today (UTC)', () => {
    const { from, to } = getQuickDateRange(30);

    expect(to.getUTCHours()).toBe(0);
    const diffDays = (to.getTime() - from.getTime()) / 86_400_000;
    expect(diffDays).toBe(30);
  });
});

describe('validateDateRange', () => {
  it('treats open-ended ranges as valid', () => {
    expect(validateDateRange(undefined, undefined)).toBe(true);
    expect(validateDateRange(new Date(), undefined)).toBe(true);
    expect(validateDateRange(undefined, new Date())).toBe(true);
  });

  it('accepts from <= to, including a single-day window', () => {
    const day = new Date(Date.UTC(2026, 4, 1));
    expect(validateDateRange(day, day)).toBe(true);
    expect(validateDateRange(day, new Date(Date.UTC(2026, 4, 2)))).toBe(true);
  });

  it('rejects an inverted range', () => {
    expect(
      validateDateRange(new Date(Date.UTC(2026, 4, 2)), new Date(Date.UTC(2026, 4, 1)))
    ).toBe(false);
  });
});

describe('useDateValidation', () => {
  it('mirrors validateDateRange and reacts to input changes', () => {
    const early = new Date(Date.UTC(2026, 4, 1));
    const late = new Date(Date.UTC(2026, 4, 2));

    const { result, rerender } = renderHook(
      ({ from, to }: { from?: Date; to?: Date }) => useDateValidation(from, to),
      { initialProps: { from: early, to: late } }
    );

    expect(result.current).toBe(true);

    rerender({ from: late, to: early });

    expect(result.current).toBe(false);
  });
});
