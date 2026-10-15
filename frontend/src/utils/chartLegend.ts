/**
 * @file chartLegend.ts
 * @module utils/chartLegend
 *
 * @summary
 * Fixed series order for Recharts legends and tooltips, keyed by series dataKey,
 * and the legend text colour shared by every chart.
 *
 * @enterprise
 * Recharts 3 sorts legend items alphabetically by their label unless told
 * otherwise, so the order followed the language: German showed "Abgang, Zugang",
 * English "Stock in, Stock out". Sorting by dataKey keeps one order in every
 * language; null is no alternative, the library documents it as unstable
 * between renders. The tooltip has the same flaw (default itemSorter 'name',
 * alphabetical), so it takes the same sorter and lists series in legend order.
 */

import type { Theme } from '@mui/material/styles';

/**
 * Builds an itemSorter for Legend and Tooltip that orders items as `keys` lists them.
 * Items whose dataKey is not listed (or not a string) go last.
 *
 * @param keys series dataKeys in display order
 * @returns a function for `<Legend itemSorter={...} />` and `<Tooltip itemSorter={...} />`
 */
export function legendOrder(keys: readonly string[]): (item: { dataKey?: unknown }) => number {
  return (item) => {
    const index = typeof item.dataKey === 'string' ? keys.indexOf(item.dataKey) : -1;
    return index === -1 ? keys.length : index;
  };
}

/**
 * Legend props shared by every Recharts legend: the item text in the text token.
 * Recharts draws each legend label in its series colour, and at 16px many series
 * colours fall below 4.5:1 as text (light grey "all others" 2.68:1, dark green
 * 2.70:1 on the dark card). The swatch keeps the series colour (fork 3 A,
 * 2026-10-15; same rule as chartTooltipProps' itemStyle).
 *
 * @param theme active MUI theme
 * @returns props to spread on `<Legend />`
 */
export function chartLegendProps(theme: Theme) {
  return { labelStyle: { color: theme.palette.text.primary } } as const;
}
