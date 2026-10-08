/**
 * @file AppearanceSettingsSection.tsx
 * @module app/settings/sections/AppearanceSettingsSection
 *
 * @summary
 * Appearance settings section component.
 * Theme (light/dark) and table density, each as a radio group.
 *
 * @enterprise
 * - The only editor for theme and density (FW5 fork 1); theme state belongs to
 *   ShellPreferencesProvider and arrives through props like density does
 */

import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { TableDensity } from '../../../context/settings/SettingsContext.types';

interface AppearanceSettingsSectionProps {
  /** Current colour scheme */
  themeMode: 'light' | 'dark';

  /** Callback when the colour scheme changes */
  onThemeModeChange: (mode: 'light' | 'dark') => void;

  /** Current table density value */
  tableDensity: TableDensity;

  /** Callback when table density changes */
  onTableDensityChange: (density: TableDensity) => void;
}

/**
 * Appearance settings section component.
 *
 * Provides table density selector with comfortable and compact options.
 * Isolated from other settings for independent testing and reuse.
 *
 * @param props - Component props
 * @returns JSX element rendering appearance settings controls
 *
 * @example
 * ```tsx
 * <AppearanceSettingsSection
 *   tableDensity="comfortable"
 *   onTableDensityChange={handleDensityChange}
 * />
 * ```
 */
export default function AppearanceSettingsSection({
  themeMode,
  onThemeModeChange,
  tableDensity,
  onTableDensityChange,
}: AppearanceSettingsSectionProps) {
  const { t } = useTranslation(['common']);

  return (
    <Stack spacing={2}>
    <FormControl>
      <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
        {t('appearance.theme')}
      </FormLabel>
      <RadioGroup
        value={themeMode}
        onChange={(e) => onThemeModeChange(e.target.value as 'light' | 'dark')}
      >
        <FormControlLabel value="light" control={<Radio size="small" />} label={t('appearance.light')} />
        <FormControlLabel value="dark" control={<Radio size="small" />} label={t('appearance.dark')} />
      </RadioGroup>
    </FormControl>
    <FormControl>
      <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
        {t('settings.tableDensity.label')}
      </FormLabel>
      <RadioGroup
        value={tableDensity}
        onChange={(e) => onTableDensityChange(e.target.value as TableDensity)}
      >
        <FormControlLabel
          value="comfortable"
          control={<Radio size="small" />}
          label={t('settings.tableDensity.comfortable')}
        />
        <FormControlLabel
          value="compact"
          control={<Radio size="small" />}
          label={t('settings.tableDensity.compact')}
        />
      </RadioGroup>
    </FormControl>
    </Stack>
  );
}
