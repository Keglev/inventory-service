/**
 * @file stockChangeColumns.ts
 * @module pages/analytics/sections/stockChangeColumns
 *
 * @summary
 * Column definitions for StockChangeTable, with helpers for the cells the
 * movement drilldown and the employee change log share.
 *
 * @enterprise
 * The helpers keep the shared cells identical in both tables: the timestamp
 * in the user's date format, the signed change in green or red with tabular
 * digits, the translated reason.
 */
import type { ReactNode } from 'react';
import type { TFunction } from 'i18next';
import type { SxProps, Theme } from '@mui/material/styles';
import type { DateFormat, NumberFormat } from '../../../context/settings/SettingsContext';
import { formatDate, formatNumber } from '../../../utils/formatters';
import { reasonLabel } from './reasonLabels';

/** One table column: header text and how a row renders in it. */
export type StockChangeColumn<R> = {
  header: string;
  render: (row: R) => ReactNode;
  align?: 'right';
  sx?: (row: R) => SxProps<Theme>;
};

/** Timestamp column in the user's date format, falling back to the raw value. */
export function dateColumn<R>(header: string, get: (row: R) => string, dateFormat: DateFormat): StockChangeColumn<R> {
  return { header, render: (row) => formatDate(get(row), dateFormat) || get(row) };
}

/** Signed change column: "+5" in green, "-3" in red, tabular digits, right-aligned. */
export function changeColumn<R>(header: string, get: (row: R) => number, numberFormat: NumberFormat): StockChangeColumn<R> {
  return {
    header,
    align: 'right',
    sx: (row) => ({ color: get(row) < 0 ? 'error.main' : 'success.main', fontVariantNumeric: 'tabular-nums' }),
    render: (row) => (get(row) > 0 ? '+' : '') + formatNumber(get(row), numberFormat, 0),
  };
}

/** Reason column with the translated reason label; empty without a reason. */
export function reasonColumn<R>(header: string, get: (row: R) => string | undefined, t: TFunction<['analytics']>): StockChangeColumn<R> {
  return { header, render: (row) => { const reason = get(row); return reason ? reasonLabel(t, reason) : ''; } };
}
