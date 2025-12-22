/**
 * @file formatters.test.ts
 * @module utils/formatters.test
 * 
 * Unit tests for date and number formatting utilities.
 * Tests formatDate, formatNumber, getCurrencyFormat, parseFormattedNumber,
 * getTodayIso, and getDaysAgoIso functions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  formatDate,
  formatNumber,
  getCurrencyFormat,
  parseFormattedNumber,
  getTodayIso,
  getDaysAgoIso,
} from '@/utils/formatters';

describe('formatDate', () => {
  it('should format date in DD.MM.YYYY format', () => {
    const date = new Date(2025, 10, 27); // Nov 27, 2025
    expect(formatDate(date, 'DD.MM.YYYY')).toBe('27.11.2025');
  });

  it('should format date in YYYY-MM-DD format', () => {
    const date = new Date(2025, 10, 27);
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2025-11-27');
  });

  it('should format date in MM/DD/YYYY format', () => {
    const date = new Date(2025, 10, 27);
    expect(formatDate(date, 'MM/DD/YYYY')).toBe('11/27/2025');
  });

  it('should handle ISO string input', () => {
    expect(formatDate('2025-11-27T10:00:00Z', 'DD.MM.YYYY')).toBe('27.11.2025');
  });

  it('should return empty string for invalid date', () => {
    expect(formatDate('invalid', 'DD.MM.YYYY')).toBe('');
    expect(formatDate(new Date('invalid'), 'YYYY-MM-DD')).toBe('');
  });

  it('should pad single-digit days and months', () => {
    const date = new Date(2025, 0, 5); // Jan 5, 2025
    expect(formatDate(date, 'DD.MM.YYYY')).toBe('05.01.2025');
  });
});

describe('formatNumber', () => {
  it('should format number in DE format with defaults', () => {
    expect(formatNumber(1234.56, 'DE')).toBe('1.234,56');
  });

  it('should format number in EN_US format with defaults', () => {
    expect(formatNumber(1234.56, 'EN_US')).toBe('1,234.56');
  });

  it('should format integer in DE format without decimals', () => {
    expect(formatNumber(1000, 'DE', 0)).toBe('1.000');
  });

  it('should format integer in EN_US format without decimals', () => {
    expect(formatNumber(1000, 'EN_US', 0)).toBe('1,000');
  });

  it('should handle custom decimal places', () => {
    expect(formatNumber(123.456789, 'DE', 4)).toBe('123,4568');
    expect(formatNumber(123.456789, 'EN_US', 3)).toBe('123.457');
  });

  it('should return empty string for NaN', () => {
    expect(formatNumber(NaN, 'DE')).toBe('');
    expect(formatNumber(NaN, 'EN_US')).toBe('');
  });

  it('should return empty string for non-number', () => {
    expect(formatNumber('string' as unknown as number, 'DE')).toBe('');
  });

  it('should format large numbers correctly', () => {
    expect(formatNumber(1234567.89, 'DE')).toBe('1.234.567,89');
    expect(formatNumber(1234567.89, 'EN_US')).toBe('1,234,567.89');
  });

  it('should handle zero', () => {
    expect(formatNumber(0, 'DE')).toBe('0,00');
    expect(formatNumber(0, 'EN_US')).toBe('0.00');
  });
});

describe('getCurrencyFormat', () => {
  it('should return DE format configuration', () => {
    const config = getCurrencyFormat('DE');
    expect(config).toEqual({ decimal: ',', thousands: '.' });
  });

  it('should return EN_US format configuration', () => {
    const config = getCurrencyFormat('EN_US');
    expect(config).toEqual({ decimal: '.', thousands: ',' });
  });
});

describe('parseFormattedNumber', () => {
  it('should parse DE formatted number', () => {
    expect(parseFormattedNumber('1.234,56', 'DE')).toBe(1234.56);
  });

  it('should parse EN_US formatted number', () => {
    expect(parseFormattedNumber('1,234.56', 'EN_US')).toBe(1234.56);
  });

  it('should return 0 for empty string', () => {
    expect(parseFormattedNumber('', 'DE')).toBe(0);
    expect(parseFormattedNumber('', 'EN_US')).toBe(0);
  });

  it('should handle numbers without thousands separators', () => {
    expect(parseFormattedNumber('123,45', 'DE')).toBe(123.45);
    expect(parseFormattedNumber('123.45', 'EN_US')).toBe(123.45);
  });

  it('should parse large numbers', () => {
    expect(parseFormattedNumber('1.234.567,89', 'DE')).toBe(1234567.89);
    expect(parseFormattedNumber('1,234,567.89', 'EN_US')).toBe(1234567.89);
  });
});

describe('getTodayIso', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return today in YYYY-MM-DD format', () => {
    vi.setSystemTime(new Date(2025, 11, 22)); // Dec 22, 2025
    expect(getTodayIso()).toBe('2025-12-22');
  });

  it('should pad single-digit months and days', () => {
    vi.setSystemTime(new Date(2025, 0, 5)); // Jan 5, 2025
    expect(getTodayIso()).toBe('2025-01-05');
  });
});

describe('getDaysAgoIso', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return date 180 days ago', () => {
    vi.setSystemTime(new Date(2025, 11, 22)); // Dec 22, 2025
    const result = getDaysAgoIso(180);
    const expected = new Date(2025, 11, 22);
    expected.setDate(expected.getDate() - 180);
    const pad = (n: number) => String(n).padStart(2, '0');
    const expectedStr = `${expected.getFullYear()}-${pad(expected.getMonth() + 1)}-${pad(expected.getDate())}`;
    expect(result).toBe(expectedStr);
  });

  it('should return today for 0 days ago', () => {
    vi.setSystemTime(new Date(2025, 11, 22));
    expect(getDaysAgoIso(0)).toBe('2025-12-22');
  });

  it('should handle year boundaries', () => {
    vi.setSystemTime(new Date(2025, 0, 15)); // Jan 15, 2025
    const result = getDaysAgoIso(30);
    expect(result).toBe('2024-12-16');
  });
});
