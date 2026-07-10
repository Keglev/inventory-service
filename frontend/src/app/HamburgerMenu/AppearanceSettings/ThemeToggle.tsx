/**
 * @file ThemeToggle.tsx
 * @module app/HamburgerMenu/AppearanceSettings/ThemeToggle
 *
 * @summary
 * Controlled light/dark mode picker rendered as a labeled two-IconButton Stack.
 *
 * @enterprise
 * - Controlled component: accepts `themeMode` + `onThemeModeChange`; no local state;
 *   persistence is owned by the parent section coordinator (AppearanceMenuSection).
 * - Distinct from `public-shell/header/ThemeToggle`: that sibling is a stateless
 *   IconButton that delegates all state up and has no translation calls; this version
 *   owns its `useTranslation` call and renders a labeled Stack with two IconButtons.
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
  themeMode: 'light' | 'dark';
  onThemeModeChange: (mode: 'light' | 'dark') => void;
}

export default function ThemeToggle({
  themeMode,
  onThemeModeChange,
}: ThemeToggleProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
        {t('appearance.theme')}
      </Typography>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <IconButton
          size="small"
          onClick={() => onThemeModeChange('light')}
          sx={{
            color: themeMode === 'light' ? 'warning.main' : 'text.secondary',
            transition: 'color 0.3s ease',
          }}
          title={t('appearance.lightMode')}
        >
          <LightModeIcon fontSize="small" />
        </IconButton>
        <Typography variant="caption">
          {themeMode === 'light' ? t('appearance.light') : t('appearance.dark')}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onThemeModeChange('dark')}
          sx={{
            color: themeMode === 'dark' ? 'info.main' : 'text.secondary',
            transition: 'color 0.3s ease',
          }}
          title={t('appearance.darkMode')}
        >
          <DarkModeIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}
