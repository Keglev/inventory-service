/**
 * @file ThemeToggle.tsx
 * @module app/HamburgerMenu/AppearanceSettings/ThemeToggle
 *
 * @summary
 * Theme mode toggle component with light/dark mode icons.
 * Displays current theme and allows switching between light and dark modes.
 *
 * @example
 * ```tsx
 * <ThemeToggle themeMode="dark" onThemeModeChange={handleChange} />
 * ```
 */

import { Box, Typography, Stack, IconButton } from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useTranslation } from 'react-i18next';

interface ThemeToggleProps {
  /** Current theme mode (light or dark) */
  themeMode: 'light' | 'dark';

  /** Callback when theme mode changes */
  onThemeModeChange: (mode: 'light' | 'dark') => void;
}

/**
 * Theme toggle component.
 *
 * Displays light/dark mode icons as clickable buttons.
 * Shows current mode label between the buttons.
 *
 * @param props - Component props
 * @returns JSX element rendering theme toggle buttons
 */
export default function ThemeToggle({
  themeMode,
  onThemeModeChange,
}: ThemeToggleProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
        {t('appearance.theme', 'Theme')}
      </Typography>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton
          size="small"
          onClick={() => onThemeModeChange('light')}
          sx={{
            color: themeMode === 'light' ? 'warning.main' : 'text.secondary',
            transition: 'color 0.3s ease',
          }}
          title={t('appearance.lightMode', 'Light Mode')}
        >
          <LightModeIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption">
          {themeMode === 'light' ? t('appearance.light', 'Light') : t('appearance.dark', 'Dark')}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onThemeModeChange('dark')}
          sx={{
            color: themeMode === 'dark' ? 'info.main' : 'text.secondary',
            transition: 'color 0.3s ease',
          }}
          title={t('appearance.darkMode', 'Dark Mode')}
        >
          <DarkModeIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}
