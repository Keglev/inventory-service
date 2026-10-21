/**
 * @file ThemeToggle.tsx
 * @module ThemeToggle
 * @summary Public-shell theme toggle button (light/dark); a stateless IconButton
 * driven by parent callbacks.
 *
 * @enterprise
 * - Public shell only. The authenticated shell has no theme toggle: the theme is
 *   edited in the settings dialog, opened from the sidebar (ADR-0015, FW6 UX-1).
 *   The label names the mode a click switches to.
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
import { useTranslation } from 'react-i18next';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

export interface ThemeToggleProps {
  themeMode: 'light' | 'dark';
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ themeMode, onToggle }) => {
  const { t } = useTranslation('common');
  const label = themeMode === 'light' ? t('shell.darkMode') : t('shell.lightMode');

  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
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
};

export default ThemeToggle;
