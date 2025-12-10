/**
 * @file useThemeMode.ts
 * @description
 * Custom hook for managing theme mode (light/dark) with localStorage persistence.
 * Initializes from localStorage on mount and persists changes.
 *
 * @enterprise
 * - localStorage persistence key: 'themeMode'
 * - Default mode: 'light'
 * - Provides toggle function for easy theme switching
 * - Automatic persistence on state change
 *
 * @example
 * ```tsx
 * const { themeMode, setThemeMode, toggleThemeMode } = useThemeMode();
 * ```
 *
 * @returns Object with themeMode state, setter, and toggle function
 */
import * as React from 'react';

const LS_THEME_KEY = 'themeMode';

interface UseThemeModeReturn {
  /** Current theme mode */
  themeMode: 'light' | 'dark';
  /** Set theme mode directly */
  setThemeMode: (mode: 'light' | 'dark') => void;
  /** Toggle between light and dark modes */
  toggleThemeMode: () => void;
}

/**
 * useThemeMode hook
 * @returns Theme mode state and control functions
 */
export const useThemeMode = (): UseThemeModeReturn => {
  const [themeMode, setThemeModeState] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(LS_THEME_KEY) as 'light' | 'dark' | null;
    return saved || 'light';
  });

  const setThemeMode = (mode: 'light' | 'dark') => {
    localStorage.setItem(LS_THEME_KEY, mode);
    setThemeModeState(mode);
  };

  const toggleThemeMode = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  return { themeMode, setThemeMode, toggleThemeMode };
};
