/**
 * @file chartTooltip.ts
 * @module utils/chartTooltip
 *
 * @summary
 * Theme-aware Recharts tooltip styling. Recharts renders tooltips on a
 * hard-coded white surface, which is wrong in dark mode; this binds the tooltip
 * surface and label to MUI theme tokens. Per-series item colors are left
 * untouched so value coloring survives.
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
  } as const;
}
