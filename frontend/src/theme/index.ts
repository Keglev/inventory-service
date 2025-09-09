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
 * Build the theme for a given locale.
 * @param locale - UI locale; defaults to 'en'
 */
export const buildTheme = (locale: SupportedLocale = 'en') => {
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

      // Light palette (can be toggled in the future if needed)
      palette: {
        mode: 'light',
        primary: { main: '#00458A' },   // Enterprise blue
        secondary: { main: '#00A3A3' }, // Teal accent
        success: { main: '#2E7D32' },
        warning: { main: '#ED6C02' },
        error: { main: '#D32F2F' },
        info: { main: '#0288D1' },
        background: { default: '#F6F7F9', paper: '#FFFFFF' },
        divider: 'rgba(0,0,0,0.08)',
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
            root: { boxShadow: 'none', borderBottom: '1px solid rgba(0,0,0,0.08)' },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: { borderRight: '1px solid rgba(0,0,0,0.08)' },
          },
        },
        MuiCard: {
          styleOverrides: { root: { borderRadius: 12 } },
        },
        MuiPaper: {
          // Use `root` instead of the `rounded` slot to ensure consistent radius application
          styleOverrides: { root: { borderRadius: 10 } },
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
