/**
 * @file chartMargin.ts
 * @module pages/dashboard/blocks/chartMargin
 * @summary Plot margin shared by the dashboard's two bar charts.
 * @enterprise
 * With Recharts' default 5px top margin the top Y label does not fit above the
 * plot, so Recharts moves it down off its grid line and then drops the next tick
 * as a collision: the 90-day movement chart lost its "60" (G-L1). The top
 * margin holds half a label, so the top tick stays on its line. Recharts
 * replaces, not merges, a margin object, so every side is given.
 */
export const CHART_MARGIN = { top: 12, right: 5, bottom: 5, left: 5 } as const;
