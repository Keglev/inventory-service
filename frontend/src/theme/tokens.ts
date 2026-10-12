/**
 * @file tokens.ts
 * @module theme/tokens
 *
 * @summary
 * Design tokens: the light and dark palette definitions consumed by
 * theme/index.ts. Single source of truth for brand colors.
 *
 * @enterprise
 * - Components must reference semantic palette tokens (success.main,
 *   error.dark, alpha(info.main, ...)) — never raw hex — so both modes
 *   stay consistent and dark mode adapts automatically.
 */

import type { PaletteOptions } from '@mui/material/styles';

/** Light-mode palette. */
export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: { main: '#1976D2' },   // Lighter enterprise blue
  secondary: { main: '#00A3A3' }, // Teal accent
  success: { main: '#2E7D32' },
  warning: { main: '#ED6C02' },
  error: { main: '#D32F2F' },
  info: { main: '#0288D1' },
  background: { default: '#F0F2F5', paper: '#FFFFFF' },
  divider: 'rgba(0,0,0,0.08)',
};

/** Dark-mode palette. */
export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: { main: '#64B5F6' },   // Light blue for dark mode
  secondary: { main: '#4DD0E1' }, // Light teal
  success: { main: '#66BB6A' },
  warning: { main: '#FFA726' },
  error: { main: '#EF5350' },
  info: { main: '#29B6F6' },
  // Three blue-grey grades about 1.2:1 apart, so page, panels (app bar, sidebar,
  // content frame) and cards (darkCardSurface) read as separate layers. The
  // tint sits with the primary blue; the page grade still clears Material's
  // 15.8:1 minimum for white text on a base darker than #121212.
  background: { default: '#0B0F14', paper: '#18202A' },
  divider: 'rgba(148,178,214,0.22)',
  // The data grid shades hovered rows from hoverOpacity; other components use
  // hover. Both carry the same strength, or grid rows hover fainter than menus.
  action: { hover: 'rgba(148,178,214,0.14)', hoverOpacity: 0.14 },
};

/**
 * Card grade in dark mode, one step above background.paper. The palette has no
 * slot for a third surface, so theme/index.ts applies it to cards and outlined
 * papers in dark mode only; in light mode cards stay on background.paper.
 */
export const darkCardSurface = '#243040';

/**
 * Card outline in light mode. Cards and the panel they lie on are both
 * background.paper, so a shadow alone barely separates them on many monitors
 * (FW6, seen on Carlos's screen 2026-10-09); a 1px outline does. Dark mode
 * separates them by surface grade instead and takes no outline.
 */
export const lightCardOutline = 'rgba(0,0,0,0.12)';

/**
 * Footer surface in light mode, one grade darker than the page background so the
 * footer reads as its own band (Carlos, 2026-10-12). Footer links use
 * primary.dark on it: primary.main (#1976D2) reaches only 3.71:1 there, below
 * WCAG AA (4.5:1) for small text; primary.dark (#115293) reaches 6.39:1. Dark mode keeps
 * background.default.
 */
export const lightFooterSurface = '#E4E7EC';
