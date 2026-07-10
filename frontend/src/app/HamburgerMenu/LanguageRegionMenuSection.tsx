/**
 * @file LanguageRegionMenuSection.tsx
 * @module app/HamburgerMenu/LanguageRegionMenuSection
 *
 * @summary
 * Section coordinator that composes LanguageToggle, DateFormatSetting, and
 * NumberFormatSetting into the language/region block of the hamburger menu.
 *
 * @enterprise
 * Same split-persistence pattern as AppearanceMenuSection: dateFormat and
 * numberFormat are persisted here via useSettings; locale state is owned
 * upstream (HamburgerMenu → AppToolbarActions) and passed through as props.
 * i18n.changeLanguage is intentionally NOT called here — LanguageToggle owns
 * that side-effect to keep this coordinator side-effect-free.
 * Mounted exclusively by MenuContent/MenuSectionsRenderer.
 */

import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import type { SupportedLocale } from '../../theme';
import { default as LanguageToggle } from './LanguageRegionSettings/LanguageToggle';
import { default as DateFormatSetting } from './LanguageRegionSettings/DateFormatSetting';
import { default as NumberFormatSetting } from './LanguageRegionSettings/NumberFormatSetting';

interface LanguageRegionMenuSectionProps {
  /** Current locale (de or en) */
  locale: SupportedLocale;

  /** Callback fired when locale is changed */
  onLocaleChange: (locale: SupportedLocale) => void;
}

export default function LanguageRegionMenuSection({
  locale,
  onLocaleChange,
}: LanguageRegionMenuSectionProps) {
  const { t } = useTranslation(['common']);
  const { userPreferences, setUserPreferences } = useSettings();

  const handleDateFormatChange = (newFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD') => {
    setUserPreferences({ dateFormat: newFormat });
  };

  const handleNumberFormatChange = (newFormat: 'DE' | 'EN_US') => {
    setUserPreferences({ numberFormat: newFormat });
  };

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('language.title', 'Sprache & Region / Language & Region')}
      </Typography>

      <Stack spacing={1.5}>
        <LanguageToggle locale={locale} onLocaleChange={onLocaleChange} />
        <DateFormatSetting
          dateFormat={userPreferences.dateFormat}
          onChange={handleDateFormatChange}
        />
        <NumberFormatSetting
          numberFormat={userPreferences.numberFormat}
          onChange={handleNumberFormatChange}
        />
      </Stack>
    </Box>
  );
}
