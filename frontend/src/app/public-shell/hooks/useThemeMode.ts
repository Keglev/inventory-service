/**
 * @file useThemeMode.ts
 * @module useThemeMode
 * @summary Manages theme mode state (light/dark) with localStorage persistence.
 *
 * @enterprise
 * - Uses THEME_MODE_KEY (distinct from LANGUAGE_KEY) so the two toggles are
 *   stored independently and do not interfere with each other.
 * - Defaults to 'light' because the public shell has no user-settings context to
 *   derive a preference from.
 * - Local hook state only — no provider needed since only AppPublicShell consumes
 *   themeMode.
 *
 * @example
 * ```tsx
 * const { themeMode, setThemeMode, toggleThemeMode } = useThemeMode();
 * ```
 */
import * as React from 'react';

import { THEME_MODE_KEY } from '../../../config/storageKeys';

interface UseThemeModeReturn {
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  toggleThemeMode: () => void;
}

export const useThemeMode = (): UseThemeModeReturn => {
  const [themeMode, setThemeModeState] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(THEME_MODE_KEY) as 'light' | 'dark' | null;
    return saved || 'light';
  });

  const setThemeMode = (mode: 'light' | 'dark') => {
    localStorage.setItem(THEME_MODE_KEY, mode);
    setThemeModeState(mode);
  };

  const toggleThemeMode = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  return { themeMode, setThemeMode, toggleThemeMode };
};
