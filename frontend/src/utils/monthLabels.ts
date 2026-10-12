/**
 * @file monthLabels.ts
 * @module utils/monthLabels
 *
 * @summary
 * Labels for monthly chart buckets keyed "YYYY-MM": a short axis label and a
 * tooltip label that names the real dates when the selected range cuts the month.
 *
 * @enterprise
 * The monthly endpoints honour the exact start and end day, so the first and last
 * bucket of a range are usually partial months: 15-30 April gave 216 units in,
 * the whole of April 261 (GRAPHS survey, 2026-10-12). A label like "01.04.2026"
 * claimed a day, and a bare "April 2026" claimed the whole month. The axis shows
 * the month; the tooltip adds the covered dates for a partial month (Carlos,
 * fork 2 option A). Month names follow the UI language; dates follow the user's
 * date format.
 */
import type { DateFormat } from '../context/settings/SettingsContext';
import { formatDate } from './formatters';

const parseMonth = (key: string): { y: number; m: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(key);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  return m >= 1 && m <= 12 ? { y, m } : null;
};

const monthName = (y: number, m: number, lang: string, month: 'short' | 'long') =>
  new Intl.DateTimeFormat(lang, { month, year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(y, m - 1, 1));

const parseDay = (iso?: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
};

/**
 * Short axis label for a month bucket, e.g. "Apr. 2026" (de) or "Apr 2026" (en).
 *
 * @param key month bucket "YYYY-MM"; anything else is returned unchanged
 * @param lang UI language (BCP 47)
 */
export function monthLabel(key: string, lang: string): string {
  const parsed = parseMonth(key);
  return parsed ? monthName(parsed.y, parsed.m, lang, 'short') : key;
}

/**
 * Tooltip label for a month bucket: the month name, plus the covered dates when
 * the range [from, to] starts after the 1st or ends before the last day.
 *
 * @param key month bucket "YYYY-MM"; anything else is returned unchanged
 * @param range selected range (ISO dates, optional), UI language and date format
 */
export function monthSpanLabel(
  key: string,
  range: { from?: string; to?: string; lang: string; dateFormat: DateFormat },
): string {
  const parsed = parseMonth(key);
  if (!parsed) return key;
  const name = monthName(parsed.y, parsed.m, range.lang, 'long');
  const first = new Date(parsed.y, parsed.m - 1, 1);
  const last = new Date(parsed.y, parsed.m, 0);
  const from = parseDay(range.from);
  const to = parseDay(range.to);
  const start = from && from > first ? from : first;
  const end = to && to < last ? to : last;
  if (start.getTime() === first.getTime() && end.getTime() === last.getTime()) return name;
  return `${name} (${formatDate(start, range.dateFormat)} – ${formatDate(end, range.dateFormat)})`;
}
