/**
 * @file formatters.test.ts
 * @module tests/unit/utils/formatters
 * @what_is_under_test formatDate / formatNumber / getCurrencyFormat / parseFormattedNumber / getTodayIso / getDaysAgoIso
 * @responsibility
 * Guarantees stable date/number formatting and parsing contracts used by UI rendering and filters,
 * including safe defaults for invalid inputs.
 * @out_of_scope
 * Locale correctness across all browsers/OS settings (Intl differences are integration concerns).
 * @out_of_scope
 * Daylight savings/timezone correctness beyond deterministic clock control in unit tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  formatDate,
  formatNumber,
  getCurrencyFormat,
  parseFormattedNumber,
  getTodayIso,
  getDaysAgoIso,
} from '@/utils/formatters';

describe('formatDate', () => {
  describe('success paths', () => {
    it.each([
      [new Date(2025, 10, 27), 'DD.MM.YYYY', '27.11.2025'],
      [new Date(2025, 10, 27), 'YYYY-MM-DD', '2025-11-27'],
      [new Date(2025, 10, 27), 'MM/DD/YYYY', '11/27/2025'],
      ['2025-11-27T10:00:00Z', 'DD.MM.YYYY', '27.11.2025'],
      [new Date(2025, 0, 5), 'DD.MM.YYYY', '05.01.2025'],
    ])('formats %o as %s', (input, format, expected) => {
      expect(formatDate(input as never, format as never)).toBe(expected);
    });
  });

  describe('failure paths', () => {
    it('returns empty string for invalid date inputs', () => {
      expect(formatDate('invalid', 'DD.MM.YYYY')).toBe('');
      expect(formatDate(new Date('invalid'), 'YYYY-MM-DD')).toBe('');
    });
  });
});

describe('formatNumber', () => {
  describe('success paths', () => {
    it.each([
      [1234.56, 'DE', undefined, '1.234,56'],
      [1234.56, 'EN_US', undefined, '1,234.56'],
      [1000, 'DE', 0, '1.000'],
      [1000, 'EN_US', 0, '1,000'],
      [123.456789, 'DE', 4, '123,4568'],
      [123.456789, 'EN_US', 3, '123.457'],
      [1234567.89, 'DE', undefined, '1.234.567,89'],
      [1234567.89, 'EN_US', undefined, '1,234,567.89'],
      [0, 'DE', undefined, '0,00'],
      [0, 'EN_US', undefined, '0.00'],
    ])('formats %s in %s', (value, locale, decimals, expected) => {
      expect(formatNumber(value as number, locale as never, decimals as never)).toBe(expected);
    });
  });

  describe('failure paths', () => {
    it('returns empty string for NaN', () => {
      expect(formatNumber(NaN, 'DE')).toBe('');
      expect(formatNumber(NaN, 'EN_US')).toBe('');
    });

    it('returns empty string for non-number values', () => {
      expect(formatNumber('string' as unknown as number, 'DE')).toBe('');
    });
  });
});

describe('getCurrencyFormat', () => {
  it.each([
    ['DE', { decimal: ',', thousands: '.' }],
    ['EN_US', { decimal: '.', thousands: ',' }],
  ])('returns %s configuration', (locale, expected) => {
    const config = getCurrencyFormat(locale as never);
    expect(config).toEqual(expected);
  });
});

describe('parseFormattedNumber', () => {
  describe('success paths', () => {
    it.each([
      ['1.234,56', 'DE', 1234.56],
      ['1,234.56', 'EN_US', 1234.56],
      ['123,45', 'DE', 123.45],
      ['123.45', 'EN_US', 123.45],
      ['1.234.567,89', 'DE', 1234567.89],
      ['1,234,567.89', 'EN_US', 1234567.89],
    ])('parses %s (%s)', (input, locale, expected) => {
      expect(parseFormattedNumber(input, locale as never)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('returns 0 for empty string', () => {
      expect(parseFormattedNumber('', 'DE')).toBe(0);
      expect(parseFormattedNumber('', 'EN_US')).toBe(0);
    });
  });
});

describe('getTodayIso', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today in YYYY-MM-DD format', () => {
    vi.setSystemTime(new Date(2025, 11, 22)); // Dec 22, 2025
    expect(getTodayIso()).toBe('2025-12-22');
  });

  it('pads single-digit months and days', () => {
    vi.setSystemTime(new Date(2025, 0, 5)); // Jan 5, 2025
    expect(getTodayIso()).toBe('2025-01-05');
  });
});

describe('getDaysAgoIso', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a date N days ago', () => {
    vi.setSystemTime(new Date(2025, 11, 22)); // Dec 22, 2025
    const daysAgo = 180;

    const result = getDaysAgoIso(daysAgo);

    const expected = new Date(2025, 11, 22);
    expected.setDate(expected.getDate() - daysAgo);
    const pad = (n: number) => String(n).padStart(2, '0');

    const expectedStr = `${expected.getFullYear()}-${pad(expected.getMonth() + 1)}-${pad(expected.getDate())}`;
    expect(result).toBe(expectedStr);
  });

  it('returns today for 0 days ago', () => {
    vi.setSystemTime(new Date(2025, 11, 22));
    expect(getDaysAgoIso(0)).toBe('2025-12-22');
  });

  it('handles year boundaries', () => {
    vi.setSystemTime(new Date(2025, 0, 15)); // Jan 15, 2025
    const result = getDaysAgoIso(30);
    expect(result).toBe('2024-12-16');
  });
});
