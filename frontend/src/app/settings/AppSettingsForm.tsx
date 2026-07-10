/**
 * @file AppSettingsForm.tsx
 * @module app/settings/AppSettingsForm
 *
 * @summary
 * Main settings form layout component.
 * Orchestrates all settings sections and manages form state through callbacks.
 *
 * @enterprise
 * - Orchestrator only: receives all state as props, no local state or side effects
 * - Sections are independently tested; this component owns only layout and section composition
 */
// BUCKET: file exceeds ~150-line guideline — review for extract/split (ST-APP2)

import {
  Box,
  Divider,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { default as AppearanceSettingsSection } from './sections/AppearanceSettingsSection';
import { default as LanguageRegionSettingsSection } from './sections/LanguageRegionSettingsSection';
import { default as SystemPreferencesSection } from './sections/SystemPreferencesSection';
import { SettingsSectionCard } from './SettingsSectionCard';
import type { DateFormat, NumberFormat, TableDensity, SystemInfo } from '../../context/settings/SettingsContext.types';

interface AppSettingsFormProps {
  /** Current date format value */
  dateFormat: DateFormat;

  /** Callback when date format changes */
  onDateFormatChange: (format: DateFormat) => void;

  /** Current number format value */
  numberFormat: NumberFormat;

  /** Callback when number format changes */
  onNumberFormatChange: (format: NumberFormat) => void;

  /** Current table density value */
  tableDensity: TableDensity;

  /** Callback when table density changes */
  onTableDensityChange: (density: TableDensity) => void;

  /** System information data */
  systemInfo: SystemInfo | null;

  /** Whether system info is currently loading */
  isLoading: boolean;
}

/**
 * Settings form component.
 *
 * Thin orchestrator that delegates to focused settings sections.
 * Manages form layout, section organization, and visual styling.
 *
 * @param props - Component props
 * @returns JSX element rendering settings form with all sections
 *
 * @example
 * ```tsx
 * <AppSettingsForm
 *   dateFormat="DD.MM.YYYY"
 *   onDateFormatChange={handleDateChange}
 *   numberFormat="DE"
 *   onNumberFormatChange={handleNumberChange}
 *   tableDensity="comfortable"
 *   onTableDensityChange={handleDensityChange}
 *   systemInfo={systemInfo}
 *   isLoading={false}
 * />
 * ```
 */
export default function AppSettingsForm({
  dateFormat,
  onDateFormatChange,
  numberFormat,
  onNumberFormatChange,
  tableDensity,
  onTableDensityChange,
  systemInfo,
  isLoading,
}: AppSettingsFormProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      <SettingsSectionCard title={t('settings.userPreferences', 'User Preferences')}>
        <Stack spacing={2}>
          <LanguageRegionSettingsSection
            dateFormat={dateFormat}
            onDateFormatChange={onDateFormatChange}
            numberFormat={numberFormat}
            onNumberFormatChange={onNumberFormatChange}
          />

          <AppearanceSettingsSection
            tableDensity={tableDensity}
            onTableDensityChange={onTableDensityChange}
          />
        </Stack>
      </SettingsSectionCard>

      <Divider />

      <SettingsSectionCard title={t('settings.systemInfo', 'System Info')}>
        <SystemPreferencesSection systemInfo={systemInfo} isLoading={isLoading} />
      </SettingsSectionCard>

    </Box>
  );
}
