/**
 * @file LanguageRegionMenuSection.tsx
 * @module app/HamburgerMenu/LanguageRegionMenuSection
 *
 * @summary
 * Language & Region settings section coordinator that composes language, date format, and number format settings.
 * Acts as a thin container orchestrating sub-components from LanguageRegionSettings subdirectory.
 *
 * @enterprise
 * - Delegates individual settings to focused sub-components
 * - Integrates with useSettings hook for persistence
 * - Maintains clean separation of concerns
 */

import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import type { SupportedLocale } from '../../theme';
import {
  LanguageToggle,
  DateFormatSetting,
  NumberFormatSetting,
} from './LanguageRegionSettings';

interface LanguageRegionMenuSectionProps {
  /** Current locale (de or en) */
  locale: SupportedLocale;

  /** Callback fired when locale is changed */
  onLocaleChange: (locale: SupportedLocale) => void;
}

/**
 * Language & Region menu section component.
 *
 * Coordinates three distinct setting controls:
 * 1. Language toggle (Deutsch/English with flags)
 * 2. Date format radio group (DD.MM.YYYY vs YYYY-MM-DD)
 * 3. Number format radio group (German vs US style)
 *
 * @param props - Component props
 * @returns JSX element rendering the language and region settings section
 */
export default function LanguageRegionMenuSection({
  locale,
  onLocaleChange,
}: LanguageRegionMenuSectionProps) {
  const { t } = useTranslation(['common']);
  const { userPreferences, setUserPreferences } = useSettings();

  // Handler for date format changes - persists to user preferences
  const handleDateFormatChange = (newFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD') => {
    setUserPreferences({ dateFormat: newFormat });
  };

  // Handler for number format changes - persists to user preferences
  const handleNumberFormatChange = (newFormat: 'DE' | 'EN_US') => {
    setUserPreferences({ numberFormat: newFormat });
  };

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('language.title', 'Sprache & Region / Language & Region')}
      </Typography>

      <Stack spacing={1.5}>
        {/* Language Selection Component */}
        <LanguageToggle locale={locale} onLocaleChange={onLocaleChange} />

        {/* Date Format Selection Component */}
        <DateFormatSetting
          dateFormat={userPreferences.dateFormat}
          onChange={handleDateFormatChange}
        />

        {/* Number Format Selection Component */}
        <NumberFormatSetting
          numberFormat={userPreferences.numberFormat}
          onChange={handleNumberFormatChange}
        />
      </Stack>
    </Box>
  );
}
