/**
 * @file formatters.ts
 * @module utils/formatters
 * @summary Locale-aware date and number formatting helpers used across analytics,
 *   dashboard, inventory, supplier, and settings surfaces. 'DE' and 'EN_US' are
 *   app-internal format codes, not BCP-47 locale tags.
 *
 * @enterprise
 * - Cross-feature utility: ~18 production call sites across api/analytics,
 *   app/settings, pages/analytics blocks, pages/dashboard, pages/inventory,
 *   pages/suppliers.
 * - Type-only dependency on SettingsContext for DateFormat / NumberFormat union
 *   types; no runtime coupling to context state.
 * - Thousands separation is manual regex, not Intl.NumberFormat — historical
 *   choice.
 * - Pure functions: no state, no side effects, safe to call in render paths.
 */
import type { DateFormat, NumberFormat } from '../context/settings/SettingsContext';

/**
 * @example
 * formatDate(new Date(2025, 10, 27), 'DD.MM.YYYY')  // -> '27.11.2025'
 * formatDate(new Date(2025, 10, 27), 'YYYY-MM-DD')  // -> '2025-11-27'
 * formatDate(new Date(2025, 10, 27), 'MM/DD/YYYY')  // -> '11/27/2025'
 */
export const formatDate = (date: Date | string, format: DateFormat): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '';
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  switch (format) {
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    default:
      return d.toISOString().split('T')[0];
  }
};

/**
 * @example
 * formatNumber(1234.56, 'DE')     // -> '1.234,56'
 * formatNumber(1234.56, 'EN_US')  // -> '1,234.56'
 * formatNumber(1000, 'DE', 0)     // -> '1.000'
 */
export const formatNumber = (num: number, format: NumberFormat, decimals: number = 2): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '';
  }

  const parts = num.toFixed(decimals).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  if (format === 'DE') {
    // Deliberate: manual separators keep DE/EN_US output byte-identical across
    // browsers and Node versions; Intl.NumberFormat locale data varies by engine.
    const thousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimals > 0 ? `${thousands},${decimalPart}` : thousands;
  } else {
    const thousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimals > 0 ? `${thousands}.${decimalPart}` : thousands;
  }
};

export const getTodayIso = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getDaysAgoIso = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Defensive rendering of a date value inside a data-grid cell.
 *
 * A grid hands its formatter an `unknown`: the value may be absent, may be a raw
 * backend timestamp, or may be malformed after a partial load. Every failure mode
 * degrades to the same placeholder glyph, so a column keeps its visual rhythm
 * instead of showing an empty or crashing cell. Shared by the inventory and the
 * supplier grid so that an unreadable date reads the same way in both.
 *
 * @param value      the raw cell value, of unknown shape
 * @param dateFormat the user's date-format preference
 * @returns the formatted date, or an em-dash when the value cannot be read
 */
export const formatDateCell = (value: unknown, dateFormat: DateFormat): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  try {
    return formatDate(date, dateFormat);
  } catch {
    return '—';
  }
};
