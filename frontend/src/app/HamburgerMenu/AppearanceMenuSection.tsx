/**
 * @file AppearanceMenuSection.tsx
 * @module app/HamburgerMenu/AppearanceMenuSection
 *
 * @summary
 * Section coordinator that composes ThemeToggle and TableDensitySetting into
 * the appearance block of the hamburger menu.
 *
 * @enterprise
 * Split persistence boundary: tableDensity is a global user preference persisted
 * here via useSettings; theme state is shell-owned (HamburgerMenu → AppToolbarActions)
 * and only passed through as props. The two different ownership models are
 * intentional — density belongs to data display, theme belongs to shell chrome.
 * Mounted exclusively by MenuContent/MenuSectionsRenderer.
 */

import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import { default as ThemeToggle } from './AppearanceSettings/ThemeToggle';
import { default as TableDensitySetting } from './AppearanceSettings/TableDensitySetting';

interface AppearanceMenuSectionProps {
  /** Current theme mode (light or dark) */
  themeMode: 'light' | 'dark';

  /** Callback when theme mode changes */
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
        {t('appearance.title')}
      </Typography>

      <Stack spacing={1.5}>
        <ThemeToggle themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
        <TableDensitySetting
          tableDensity={userPreferences.tableDensity}
          onChange={handleDensityChange}
        />
      </Stack>
    </Box>
  );
}
