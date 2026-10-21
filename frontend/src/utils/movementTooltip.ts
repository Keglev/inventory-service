/**
 * @file movementTooltip.ts
 * @module utils/movementTooltip
 * @summary Order and text of the monthly stock-movement charts' tooltip and
 *   legend: stock in before stock out, the month as a date span clipped to the
 *   shown window, and each value as a formatted count with its unit.
 *
 * @enterprise
 * - Consumers: the Analytics line card (MovementLineCard) and the Dashboard bar
 *   chart (MonthlyMovementMini). They show the same data and held the same nine
 *   tooltip lines until FO5; one copy keeps the two from drifting apart.
 * - Styling and order stay at the call site: each chart spreads
 *   chartTooltipProps and writes itemSorter={MOVEMENT_ORDER} on its Tooltip,
 *   which the tooltip and legend contract tests read in every chart file.
 * - Caller-side i18n: the unit arrives translated, so either namespace's
 *   units.pieces works (both read "pcs" / "Stk.").
 */
import type { TooltipProps } from 'recharts';
import type { DateFormat, NumberFormat } from '../context/settings/SettingsContext';
import { legendOrder } from './chartLegend';
import { formatNumber } from './formatters';
import { monthSpanLabel } from './monthLabels';

/** Stock in before stock out in every language, for the legend and the tooltip. */
export const MOVEMENT_ORDER = legendOrder(['stockIn', 'stockOut']);

export interface MovementTooltipOptions {
  /** Shown window, ISO days; the first and last month are clipped to it. */
  from?: string;
  to?: string;
  lang: string;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  /** Translated unit appended to each value, e.g. "pcs". */
  unit: string;
}

export type MovementTooltip = Pick<TooltipProps, 'labelFormatter' | 'formatter'>;

/**
 * Tooltip title and value formatters for a monthly movement chart, spread after
 * the styling: `<Tooltip {...chartTooltipProps(theme)} itemSorter={MOVEMENT_ORDER}
 * {...movementTooltip(options)} />`.
 */
export function movementTooltip(options: MovementTooltipOptions): MovementTooltip {
  const { from, to, lang, dateFormat, numberFormat, unit } = options;
  return {
    labelFormatter: (value) => monthSpanLabel(String(value), { from, to, lang, dateFormat }),
    formatter: (value) => (typeof value === 'number' ? `${formatNumber(value, numberFormat, 0)} ${unit}` : value),
  };
}
