/**
 * @file ThemeToggle.tsx
 * @description
 * Theme mode toggle button (light/dark) for the public shell header.
 * Displays appropriate icon based on current mode and persists selection.
 *
 * @enterprise
 * - Clean MUI IconButton with smooth transitions
 * - Accessible tooltip for user guidance
 * - Icon changes based on current theme mode
 * - Color coding: warning.main (light), info.main (dark)
 *
 * @example
 * ```tsx
 * <ThemeToggle
 *   themeMode="light"
 *   onToggle={() => setThemeMode(prev => prev === 'light' ? 'dark' : 'light')}
 * />
 * ```
 */
import * as React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

interface ThemeToggleProps {
  /** Current theme mode: 'light' or 'dark' */
  themeMode: 'light' | 'dark';
  /** Callback when toggle is clicked */
  onToggle: () => void;
}

/**
 * ThemeToggle component
 * @param themeMode - Current theme mode ('light' | 'dark')
 * @param onToggle - Callback function to toggle theme
 * @returns Theme toggle button with appropriate icon
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ themeMode, onToggle }) => (
  <Tooltip title={themeMode === 'light' ? 'Dark mode' : 'Light mode'}>
    <IconButton
      onClick={onToggle}
      sx={{
        color: themeMode === 'light' ? 'warning.main' : 'info.main',
        transition: 'color 0.3s ease',
      }}
    >
      {themeMode === 'light' ? <LightModeIcon /> : <DarkModeIcon />}
    </IconButton>
  </Tooltip>
);

export default ThemeToggle;
