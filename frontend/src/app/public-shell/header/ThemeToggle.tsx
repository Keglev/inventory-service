/**
 * @file ThemeToggle.tsx
 * @module ThemeToggle
 * @summary Public-shell theme toggle button (light/dark); a stateless IconButton
 * driven by parent callbacks.
 *
 * @enterprise
 * - Distinct from the HamburgerMenu ThemeToggle twin: this component accepts a
 *   plain callback and uses hardcoded EN labels; the authenticated-shell twin owns
 *   i18n side-effects and calls t() for its label. Do not merge until ST-APP4.
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
  themeMode: 'light' | 'dark';
  onToggle?: () => void;
  // BUCKET: dead dual-callback backwards-compat shim; only one caller, collapse to single prop (CB-APP11)
  onThemeToggle?: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ themeMode, onToggle, onThemeToggle }) => {
  // BUCKET: hardcoded label bypasses t() (CB-APP10)
  const label = themeMode === 'light' ? 'Dark mode' : 'Light mode';
  // BUCKET: dead dual-callback backwards-compat shim; only one caller, collapse to single prop (CB-APP11)
  const handleToggle = onToggle ?? onThemeToggle;

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        onClick={handleToggle}
        sx={{
          color: themeMode === 'light' ? 'warning.main' : 'info.main',
          transition: 'color 0.3s ease',
        }}
      >
        {themeMode === 'light' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
