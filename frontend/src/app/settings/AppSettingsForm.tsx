/**
 * @file AppSettingsForm.tsx
 * @module app/settings/AppSettingsForm
 *
 * @summary
 * Main settings form layout component.
 * Orchestrates all settings sections and manages form state through callbacks.
 *
 * @enterprise
 * - Thin orchestrator delegating to focused settings sections
 * - Manages form layout and section organization
 * - Handles reset to defaults and form submission
 * - Consistent paper styling for all sections
 * - i18n support for section headers
 * - Full TypeDoc coverage for form orchestration
 */

import {
  Box,
  Paper,
  Typography,
  Divider,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  AppearanceSettingsSection,
  LanguageRegionSettingsSection,
  SystemPreferencesSection,
  NotificationsSettingsSection,
} from './sections';
import type { DateFormat, NumberFormat, TableDensity } from '../../context/settings';

interface SystemInfo {
  database: string;
  environment: string;
  version: string;
  status: string;
  buildDate: string;
}

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
      
      {/* User Preferences Section */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            color: 'primary.main',
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            letterSpacing: 0.5,
          }}
        >
          {t('settings.userPreferences', 'User Preferences')}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={2}>
            {/* Language & Region Settings */}
            <LanguageRegionSettingsSection
              dateFormat={dateFormat}
              onDateFormatChange={onDateFormatChange}
              numberFormat={numberFormat}
              onNumberFormatChange={onNumberFormatChange}
            />

            {/* Appearance Settings */}
            <AppearanceSettingsSection
              tableDensity={tableDensity}
              onTableDensityChange={onTableDensityChange}
            />
          </Stack>
        </Paper>
      </Box>

      <Divider />

      {/* System Info Section */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            color: 'primary.main',
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            letterSpacing: 0.5,
          }}
        >
          {t('settings.systemInfo', 'System Info')}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <SystemPreferencesSection systemInfo={systemInfo} isLoading={isLoading} />
        </Paper>
      </Box>

      <Divider />

      {/* Notifications Section */}
      <Box>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            mb: 1.5,
            color: 'primary.main',
            textTransform: 'uppercase',
            fontSize: '0.875rem',
            letterSpacing: 0.5,
          }}
        >
          {t('settings.notifications', 'Notifications')}
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <NotificationsSettingsSection />
        </Paper>
      </Box>

    </Box>
  );
}
