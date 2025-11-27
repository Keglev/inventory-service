/**
 * @file formatters.ts
 * @description
 * Date and number formatting utilities based on user preferences.
 * Supports multiple locales and formats (DE, EN_US, etc.).
 *
 * @enterprise
 * - Locale-aware formatting
 * - Reusable across components
 * - Type-safe
 * - Consistent formatting throughout app
 *
 * @usage
 * import { formatDate, formatNumber } from '../utils/formatters'
 * formatDate(new Date(), 'DD.MM.YYYY')  // → '27.11.2025'
 * formatNumber(1234.56, 'DE')           // → '1.234,56'
 */
import type { DateFormat, NumberFormat } from '../context/SettingsContext';

/**
 * Format a date according to the specified format.
 * @param date - Date object or ISO string
 * @param format - Target date format
 * @returns Formatted date string
 * @example
 * formatDate(new Date(2025, 10, 27), 'DD.MM.YYYY')  // → '27.11.2025'
 * formatDate(new Date(2025, 10, 27), 'YYYY-MM-DD')  // → '2025-11-27'
 * formatDate(new Date(2025, 10, 27), 'MM/DD/YYYY')  // → '11/27/2025'
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
 * Format a number according to locale-specific conventions.
 * @param num - Number to format
 * @param format - Target number format ('DE' or 'EN_US')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 * @example
 * formatNumber(1234.56, 'DE')     // → '1.234,56'
 * formatNumber(1234.56, 'EN_US')  // → '1,234.56'
 * formatNumber(1000, 'DE', 0)     // → '1.000'
 */
export const formatNumber = (num: number, format: NumberFormat, decimals: number = 2): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    return '';
  }

  const parts = num.toFixed(decimals).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  if (format === 'DE') {
    // German: 1.234,56 (dot for thousands, comma for decimal)
    const thousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimals > 0 ? `${thousands},${decimalPart}` : thousands;
  } else {
    // English/US: 1,234.56 (comma for thousands, dot for decimal)
    const thousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimals > 0 ? `${thousands}.${decimalPart}` : thousands;
  }
};

/**
 * Get number formatting configuration for DataGrid/tables.
 * Useful for currency formatting in tables.
 * @param format - Target number format
 * @returns Object with decimal and thousands separators
 * @example
 * const config = getCurrencyFormat('DE')  // → { decimal: ',', thousands: '.' }
 */
export const getCurrencyFormat = (format: NumberFormat): { decimal: string; thousands: string } => {
  return format === 'DE'
    ? { decimal: ',', thousands: '.' }
    : { decimal: '.', thousands: ',' };
};

/**
 * Parse a formatted number string back to a number.
 * Useful for form inputs.
 * @param str - Formatted number string
 * @param format - Format of the input string
 * @returns Parsed number
 * @example
 * parseFormattedNumber('1.234,56', 'DE')   // → 1234.56
 * parseFormattedNumber('1,234.56', 'EN_US') // → 1234.56
 */
export const parseFormattedNumber = (str: string, format: NumberFormat): number => {
  if (!str) return 0;

  if (format === 'DE') {
    // German: remove dots (thousands separator), replace comma with dot
    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
  } else {
    // English/US: remove commas (thousands separator)
    return parseFloat(str.replace(/,/g, ''));
  }
};
