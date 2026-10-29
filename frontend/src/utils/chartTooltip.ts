/**
 * @file chartTooltip.ts
 * @module utils/chartTooltip
 *
 * @summary
 * Theme-aware Recharts tooltip styling: binds the tooltip surface, label and
 * item text to MUI theme tokens.
 *
 * @enterprise
 * Recharts renders tooltips on a hard-coded white surface, which is wrong in
 * dark mode.
 */
import type { Theme } from '@mui/material/styles';

/**
 * Recharts Tooltip props that theme the surface and label from the MUI theme.
 * Spread onto a Tooltip: `<Tooltip {...chartTooltipProps(theme)} ... />`.
 *
 * @param theme the active MUI theme
 */
export function chartTooltipProps(theme: Theme) {
  return {
    contentStyle: {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
    },
    labelStyle: { color: theme.palette.text.primary },
    // Recharts colours each item in its series colour. As text those colours fall
    // below 4.5:1 on the tooltip surface (dark: 3.32 for the green), so names and
    // values take the text token; the series colour stays on the marks (LO-2).
    itemStyle: { color: theme.palette.text.primary },
    // The band behind a hovered bar. Recharts paints it #ccc, which glares on a
    // dark card; the theme's selection tint is subtle in both modes.
    cursor: { fill: theme.palette.action.selected },
  } as const;
}
