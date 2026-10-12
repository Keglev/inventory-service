/**
 * @file chartLegend.ts
 * @module utils/chartLegend
 *
 * @summary
 * Fixed legend order for Recharts charts, keyed by series dataKey.
 *
 * @enterprise
 * Recharts 3 sorts legend items alphabetically by their label unless told
 * otherwise, so the order followed the language: German showed "Abgang, Zugang",
 * English "Stock in, Stock out". Sorting by dataKey keeps one order in every
 * language; null is no alternative, the library documents it as unstable
 * between renders.
 */
import type { LegendPayload } from 'recharts';

/**
 * Builds a Legend itemSorter that orders items as `keys` lists them.
 * Items whose dataKey is not listed (or not a string) go last.
 *
 * @param keys series dataKeys in display order
 * @returns a function for `<Legend itemSorter={...} />`
 */
export function legendOrder(keys: readonly string[]): (item: LegendPayload) => number {
  return (item) => {
    const index = typeof item.dataKey === 'string' ? keys.indexOf(item.dataKey) : -1;
    return index === -1 ? keys.length : index;
  };
}
