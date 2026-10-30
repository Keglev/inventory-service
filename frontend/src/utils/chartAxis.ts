/**
 * @file chartAxis.ts
 * @module utils/chartAxis
 *
 * @summary
 * Axis tick props shared by every Recharts XAxis and YAxis: the tick labels in
 * the secondary text token.
 *
 * @enterprise
 * Recharts draws tick labels in its fixed #666. On the light card that is 5.74:1,
 * on the dark card (#243040) only 2.33:1, below the 4.5:1 text minimum (S2-6,
 * measured on twelve charts 2026-10-30). text.secondary keeps light mode at the
 * same grey and lifts dark mode to 7.38:1. Same rule as chartTooltipProps and
 * chartLegendProps: chart text takes a text token, marks keep their colours.
 */

import type { Theme } from '@mui/material/styles';

/**
 * Tick props for `<XAxis />` and `<YAxis />`.
 *
 * @param theme active MUI theme
 * @param tick font size for the tick labels, where a chart needs a smaller one; the fill
 *   always comes from the theme
 * @returns props to spread on an axis
 */
export function chartAxisProps(theme: Theme, tick: { fontSize?: number; fill?: string } = {}) {
  return { tick: { ...tick, fill: theme.palette.text.secondary } } as const;
}
