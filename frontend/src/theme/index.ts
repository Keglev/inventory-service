/**
 * @file src/theme/index.ts
 * @module theme
 * @summary MUI theme factory — builds the fully-configured ThemeProvider input for a
 *   given locale and color mode. Single source of truth for palette, typography,
 *   spacing, and component overrides.
 *
 * @enterprise
 * - Consumed by AppShell.tsx (authenticated shell) and AppPublicShell.tsx (unauthenticated
 *   shell) via React.useMemo; each shell owns its own themeMode state and calls
 *   buildTheme(locale, themeMode) — there is no shared theme context.
 * - Color-mode state: AppShell holds themeMode in useState (persisted to localStorage
 *   key 'themeMode'); AppPublicShell delegates to the useThemeMode hook.
 * - Import direction: leaf — depends only on @mui/material and @mui/x-data-grid; no
 *   imports from /utils, /context, /components, or feature code.
 * - CSS variables (cssVariables: true) are a MUI v7 feature; they let consuming
 *   components reference palette tokens without importing the theme object at runtime.
 */

import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { deDE as coreDeDE, enUS as coreEnUS } from '@mui/material/locale';
import { deDE as dataGridDeDE, enUS as dataGridEnUS } from '@mui/x-data-grid/locales';
import '@mui/x-data-grid/themeAugmentation';
import { darkPalette, lightPalette } from './tokens';

const locales = {
  en: [coreEnUS, dataGridEnUS],
  de: [coreDeDE, dataGridDeDE],
} as const;

export type SupportedLocale = keyof typeof locales; // 'en' | 'de'

/**
 * Vertical padding for compact table cells, in px. Deliberately 6 — one notch
 * tighter than the 8px spacing step — to maximise data-grid row density without
 * clipping text. Off the spacing scale by design.
 */
const TABLE_CELL_PADDING_Y = 6;

export const buildTheme = (locale: SupportedLocale = 'en', mode: 'light' | 'dark' = 'light') => {
  const base = createTheme(
    {
      // WHY: MUI v7 CSS-variable output; consuming components reference palette tokens without importing the theme object.
      cssVariables: true,

      spacing: 8,
      shape: { borderRadius: 10 },

      typography: {
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
        h1: { fontWeight: 600 },
        h2: { fontWeight: 600 },
        h3: { fontWeight: 600 },
      },

      palette: mode === 'light' ? lightPalette : darkPalette,

      components: {
        MuiButton: { defaultProps: { size: 'small' } },
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiFormControl: { defaultProps: { size: 'small' } },
        MuiSelect: { defaultProps: { size: 'small' } },
        MuiAutocomplete: { defaultProps: { size: 'small' } },
        MuiTable: { defaultProps: { size: 'small' } },
        MuiTableCell: {
          styleOverrides: { root: { paddingTop: TABLE_CELL_PADDING_Y, paddingBottom: TABLE_CELL_PADDING_Y } },
        },
        MuiListItem: { defaultProps: { dense: true } },
        MuiListItemButton: { defaultProps: { dense: true } },

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
          // WHY: targeting `root` applies to all Paper instances regardless of variant; the `rounded` slot is variant-specific.
          styleOverrides: {
            root: { 
              borderRadius: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
            } 
          },
        },

        MuiCssBaseline: {
          // WHY: scrollbar styling is owned by global.css (loaded before React, shell-independent); only the body background reset lives here.
          styleOverrides: {
            body: { backgroundImage: 'none' },
          },
        },

        MuiDataGrid: {
          defaultProps: {
            density: 'compact',
            // WHY: locale text is injected via the locale bundle spread below, not via the localeText prop.
          },
        },
      },
    },
    ...locales[locale]
  );

  return responsiveFontSizes(base);
};
