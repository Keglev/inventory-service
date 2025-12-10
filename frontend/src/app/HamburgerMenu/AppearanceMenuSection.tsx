/**
 * @file AppearanceMenuSection.tsx
 * @module app/HamburgerMenu/AppearanceMenuSection
 *
 * @summary
 * Appearance menu section coordinator that composes theme and density settings.
 * Acts as a thin container orchestrating sub-components from AppearanceSettings subdirectory.
 *
 * @enterprise
 * - Delegates individual settings to focused sub-components
 * - Integrates with useSettings hook for persistence
 * - Maintains clean separation of concerns
 */

import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { ThemeToggle, TableDensitySetting } from './AppearanceSettings';

interface AppearanceMenuSectionProps {
  /** Current theme mode (light or dark) */
  themeMode: 'light' | 'dark';

  /** Callback when theme mode changes */
  onThemeModeChange: (mode: 'light' | 'dark') => void;
}

/**
 * Appearance menu section component.
 *
 * Coordinates two distinct appearance setting controls:
 * 1. Theme toggle (light/dark mode with icons)
 * 2. Table density radio group (comfortable vs compact)
 *
 * @param props - Component props
 * @returns JSX element rendering the appearance settings section
 */
export default function AppearanceMenuSection({
  themeMode,
  onThemeModeChange,
}: AppearanceMenuSectionProps) {
  const { t } = useTranslation(['common']);
  const { userPreferences, setUserPreferences } = useSettings();

  // Handler for density changes - persists to user preferences
  const handleDensityChange = (newDensity: 'compact' | 'comfortable') => {
    setUserPreferences({ tableDensity: newDensity });
  };

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('appearance.title', 'Erscheinungsbild / Appearance')}
      </Typography>

      <Stack spacing={1.5}>
        {/* Theme Toggle Component */}
        <ThemeToggle themeMode={themeMode} onThemeModeChange={onThemeModeChange} />

        {/* Table Density Setting Component */}
        <TableDensitySetting
          tableDensity={userPreferences.tableDensity}
          onChange={handleDensityChange}
        />
      </Stack>
    </Box>
  );
}
