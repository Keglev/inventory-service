/**
 * @file useDayFormatter.test.ts
 * @module __tests__/hooks/useDayFormatter
 * @testing useDayFormatter
 * @description Epoch ms and ISO dates format in the user's date format; a value
 *   that is not a date comes back unchanged.
 */
import { describe, it, expect, vi } from 'vitest';
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
});
