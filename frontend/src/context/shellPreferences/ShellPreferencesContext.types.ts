/**
 * @file ShellPreferencesContext.types.ts
 * @module context/shellPreferences/ShellPreferencesContext.types
 *
 * @summary
 * Types and the React context object for the shell-wide language and theme
 * preferences.
 *
 * @enterprise
 * - The context object lives apart from the provider component so the provider
 *   file exports only a component (React Fast Refresh), the same split as
 *   context/settings.
 * - ShellPreferences is named in useShellPreferences' signature, so it stays
 *   exported (TypeDoc runs with --treatWarningsAsErrors over src/context).
 */

import * as React from 'react';
import type { buildTheme, SupportedLocale } from '../../theme';

/** Colour scheme of the MUI theme. */
export type ThemeMode = 'light' | 'dark';

/** Language and theme state shared by the public shell and the app shell. */
export interface ShellPreferences {
  /** Current UI language, normalised to a supported locale. */
  locale: SupportedLocale;
  /** Current colour scheme. */
  themeMode: ThemeMode;
  /** MUI theme built from locale and themeMode. */
  theme: ReturnType<typeof buildTheme>;
  /** Persists the language, updates state and switches i18next; resolves once i18next has switched. */
  setLocale: (next: SupportedLocale) => Promise<void>;
  /** Persists the colour scheme and updates state. */
  setThemeMode: (mode: ThemeMode) => void;
}

/** Context object; read it through useShellPreferences. */
export const ShellPreferencesContext = React.createContext<ShellPreferences | undefined>(undefined);
