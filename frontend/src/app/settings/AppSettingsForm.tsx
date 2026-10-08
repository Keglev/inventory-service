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
 * - The one editor for every preference (FW5 fork 1), laid out like the SAP
 *   Fiori settings dialog: Appearance, then Language and Region
 * - Sections are independently tested; this component owns only layout and section composition
 */

import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { default as AppearanceSettingsSection } from './sections/AppearanceSettingsSection';
import { default as LanguageRegionSettingsSection } from './sections/LanguageRegionSettingsSection';
import { SettingsSectionCard } from './SettingsSectionCard';
import type { DateFormat, NumberFormat, TableDensity } from '../../context/settings/SettingsContext.types';
import type { SupportedLocale } from '../../theme';
import type { ThemeMode } from '../../context/shellPreferences/ShellPreferencesContext.types';

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

  /** Current colour scheme */
  themeMode: ThemeMode;

  /** Callback when the colour scheme changes */
  onThemeModeChange: (mode: ThemeMode) => void;

  /** Current UI language */
  locale: SupportedLocale;

  /** Callback when the UI language changes */
  onLocaleChange: (locale: SupportedLocale) => void;
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
 *   themeMode="light"
 *   onThemeModeChange={handleThemeChange}
 *   locale="de"
 *   onLocaleChange={handleLocaleChange}
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
  themeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
}: AppSettingsFormProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      
      <SettingsSectionCard title={t('settings.appearance')}>
        <AppearanceSettingsSection
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          tableDensity={tableDensity}
          onTableDensityChange={onTableDensityChange}
        />
      </SettingsSectionCard>

      <SettingsSectionCard title={t('settings.languageRegion')}>
        <LanguageRegionSettingsSection
          locale={locale}
          onLocaleChange={onLocaleChange}
          dateFormat={dateFormat}
          onDateFormatChange={onDateFormatChange}
          numberFormat={numberFormat}
          onNumberFormatChange={onNumberFormatChange}
        />
      </SettingsSectionCard>

    </Box>
  );
}
