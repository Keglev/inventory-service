/**
 * @file AppearanceMenuSection.tsx
 * @module app/HamburgerMenu/AppearanceMenuSection
 *
 * @summary
 * Appearance settings: theme mode (light/dark) toggle and table density (Comfortable/Compact).
 * Integrates with useSettings hook for density and local AppShell state for theme.
 */

import {
  Box,
  Typography,
  Stack,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';

interface AppearanceMenuSectionProps {
  themeMode: 'light' | 'dark';
  onThemeModeChange: (mode: 'light' | 'dark') => void;
}

export default function AppearanceMenuSection({
  themeMode,
  onThemeModeChange,
}: AppearanceMenuSectionProps) {
  const { t } = useTranslation(['common']);
  const { userPreferences, setUserPreferences } = useSettings();

  const handleDensityChange = (newDensity: 'compact' | 'comfortable') => {
    setUserPreferences({ tableDensity: newDensity });
  };

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('appearance.title', 'Erscheinungsbild / Appearance')}
      </Typography>

      <Stack spacing={1.5}>
        {/* Theme Toggle */}
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

        {/* Table Density */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
            {t('appearance.density', 'Density')}
          </Typography>
          <ToggleButtonGroup
            value={userPreferences.tableDensity}
            exclusive
            onChange={(_, newDensity) => {
              if (newDensity) handleDensityChange(newDensity as 'compact' | 'comfortable');
            }}
            size="small"
            fullWidth
          >
            <ToggleButton value="comfortable">
              <Typography variant="caption">
                {t('appearance.standard', 'Standard')}
              </Typography>
            </ToggleButton>
            <ToggleButton value="compact">
              <Typography variant="caption">
                {t('appearance.compact', 'Kompakt')}
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>
    </Box>
  );
}
