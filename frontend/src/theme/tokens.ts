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
  background: { default: '#121212', paper: '#1E1E1E' },
  divider: 'rgba(255,255,255,0.12)',
};
