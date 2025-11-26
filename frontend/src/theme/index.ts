/**
 * @file src/theme/index.ts
 * @description
 * MUI theme factory for Smart Supply Pro (MUI 7.2.0).
 * - German/English locale packs (Material Core + X DataGrid)
 * - Compact density defaults
 * - 8px spacing grid, enterprise palette, CSS variables enabled
 * - Responsive font sizes
 *
 * @enterprise
 * - Keep all visual tokens and component defaults here (single source of truth).
 * - DataGrid defaults (density) align with the global compact baseline.
 * - Prefer theme overrides over ad-hoc `sx` where possible.
 */

import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { deDE as coreDeDE, enUS as coreEnUS } from '@mui/material/locale';
import { deDE as dataGridDeDE, enUS as dataGridEnUS } from '@mui/x-data-grid/locales';
import '@mui/x-data-grid/themeAugmentation';

/**
 * Merge locale bundles for Material Core + X Data Grid.
 */
const locales = {
  en: [coreEnUS, dataGridEnUS],
  de: [coreDeDE, dataGridDeDE],
} as const;

/** Supported UI locales. */
export type SupportedLocale = keyof typeof locales; // 'en' | 'de'

/**
 * Build the theme for a given locale and mode.
 * @param locale - UI locale; defaults to 'en'
 * @param mode - 'light' or 'dark'; defaults to 'light'
 */
export const buildTheme = (locale: SupportedLocale = 'en', mode: 'light' | 'dark' = 'light') => {
  const base = createTheme(
    {
      // MUI v7: output CSS variables for palette/typography/etc.
      cssVariables: true,

      // 8px spacing grid and rounded shapes
      spacing: 8,
      shape: { borderRadius: 10 },

      // Enterprise typography
      typography: {
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
      },

      // Enterprise palette (light/dark modes)
      palette: mode === 'light' ? {
        mode: 'light',
        primary: { main: '#1976D2' },   // Lighter enterprise blue
        secondary: { main: '#00A3A3' }, // Teal accent
        success: { main: '#2E7D32' },
        warning: { main: '#ED6C02' },
        error: { main: '#D32F2F' },
        info: { main: '#0288D1' },
        background: { default: '#F0F2F5', paper: '#FFFFFF' },
        divider: 'rgba(0,0,0,0.08)',
      } : {
        mode: 'dark',
        primary: { main: '#64B5F6' },   // Light blue for dark mode
        secondary: { main: '#4DD0E1' }, // Light teal
        success: { main: '#66BB6A' },
        warning: { main: '#FFA726' },
        error: { main: '#EF5350' },
        info: { main: '#29B6F6' },
        background: { default: '#121212', paper: '#1E1E1E' },
        divider: 'rgba(255,255,255,0.12)',
      },

      // Component defaults & style overrides
      components: {
        //
        // Density defaults: compact across form/table controls
        //
        MuiButton: { defaultProps: { size: 'small' } },
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiFormControl: { defaultProps: { size: 'small' } },
        MuiSelect: { defaultProps: { size: 'small' } },
        MuiAutocomplete: { defaultProps: { size: 'small' } },
        MuiTable: { defaultProps: { size: 'small' } },
        MuiTableCell: {
          styleOverrides: { root: { paddingTop: 6, paddingBottom: 6 } },
        },
        MuiListItem: { defaultProps: { dense: true } },
        MuiListItemButton: { defaultProps: { dense: true } },

        //
        // App chrome polish
        //
        MuiAppBar: {
          styleOverrides: {
            root: { 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderBottom: 'none',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: { borderRight: '1px solid rgba(0,0,0,0.08)' },
          },
        },
        MuiCard: {
          styleOverrides: { 
            root: { 
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            } 
          },
        },
        MuiPaper: {
          // Use `root` instead of the `rounded` slot to ensure consistent radius application
          styleOverrides: { 
            root: { 
              borderRadius: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            } 
          },
        },

        //
        // Global baseline polishing (scrollbars, bg image)
        //
        MuiCssBaseline: {
          styleOverrides: {
            body: { backgroundImage: 'none' },
            '*::-webkit-scrollbar': { height: 8, width: 8 },
            '*::-webkit-scrollbar-thumb': {
              borderRadius: 8,
              background: 'rgba(0,0,0,0.28)',
            },
          },
        },

        //
        // X Data Grid defaults (align with compact density)
        //
        MuiDataGrid: {
          defaultProps: {
            density: 'compact',
            // locale text comes from the locale bundle we merge below
          },
        },
      },
    },
    // Merge in the locale objects for the chosen language
    ...locales[locale]
  );

  // Responsive font scaling for headings
  return responsiveFontSizes(base);
};
