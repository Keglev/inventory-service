/**
 * @file useDayFormatter.test.ts
 * @module __tests__/hooks/useDayFormatter
 * @testing useDayFormatter
 * @description Epoch ms and ISO dates format in the user's date format; a value
 *   that is not a date comes back unchanged; a UTC-midnight axis value keeps its
 *   day in every time zone.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDayFormatter } from '@/hooks/useDayFormatter';

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ userPreferences: { dateFormat: 'DD.MM.YYYY', numberFormat: 'DE' } }),
}));

describe('useDayFormatter', () => {
  it('formats epoch ms and ISO dates, and returns other values unchanged', () => {
    const { result } = renderHook(() => useDayFormatter());
    expect(result.current(Date.parse('2026-06-01'))).toBe('01.06.2026');
    expect(result.current('2026-06-02')).toBe('02.06.2026');
    expect(result.current('soon')).toBe('soon');
  });

  // A time axis carries UTC midnights; west of UTC a local reading lands on the
  // previous day (LO-4), east of UTC on the same day, so both sides are checked.
  describe('axis day across time zones', () => {
    const originalTz = process.env.TZ;
    afterEach(() => {
      process.env.TZ = originalTz;
    });

    it('keeps the day of a UTC-midnight value when west of UTC', () => {
      process.env.TZ = 'America/Los_Angeles';
      const { result } = renderHook(() => useDayFormatter());
      expect(result.current(Date.parse('2026-10-13'))).toBe('13.10.2026');
    });

    it('keeps the day of a UTC-midnight value when east of UTC', () => {
      process.env.TZ = 'Asia/Tokyo';
      const { result } = renderHook(() => useDayFormatter());
      expect(result.current(Date.parse('2026-10-13'))).toBe('13.10.2026');
    });
  });
});
