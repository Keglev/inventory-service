/**
 * @file LanguageRegionMenuSection.tsx
 * @module app/HamburgerMenu/LanguageRegionMenuSection
 *
 * @summary
 * Language & Region settings: language (Deutsch/Englisch), date format, number format.
 * Integrates with i18n, useSettings hook, and flag images.
 */

import {
  Box,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../hooks/useSettings';
import type { SupportedLocale } from '../../theme';
import deFlag from '/flags/de.svg';
import usFlag from '/flags/us.svg';

interface LanguageRegionMenuSectionProps {
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
}

export default function LanguageRegionMenuSection({
  locale,
  onLocaleChange,
}: LanguageRegionMenuSectionProps) {
  const { t, i18n } = useTranslation(['common']);
  const { userPreferences, setUserPreferences } = useSettings();

  const handleLanguageChange = (newLocale: SupportedLocale) => {
    onLocaleChange(newLocale);
  };

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
        {/* Language Toggle */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.75 }}>
            {t('language.language', 'Language')}
          </Typography>
          <ToggleButtonGroup
            value={locale}
            exclusive
            onChange={(_, newLocale) => {
              if (newLocale) {
                handleLanguageChange(newLocale as SupportedLocale);
                i18n.changeLanguage(newLocale);
              }
            }}
            size="small"
            fullWidth
          >
            <ToggleButton value="de" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <img src={deFlag} alt="Deutsch" width={14} height={14} />
              <Typography variant="caption">Deutsch</Typography>
            </ToggleButton>
            <ToggleButton value="en" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <img src={usFlag} alt="English" width={14} height={14} />
              <Typography variant="caption">English</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Date Format */}
        <FormControl size="small" component="fieldset">
          <FormLabel sx={{ fontWeight: 600, mb: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {t('language.dateFormat', 'Date Format')}
            </Typography>
          </FormLabel>
          <RadioGroup
            value={userPreferences.dateFormat}
            onChange={(e) => handleDateFormatChange(e.target.value as 'DD.MM.YYYY' | 'YYYY-MM-DD')}
            row
          >
            <FormControlLabel
              value="DD.MM.YYYY"
              control={<Radio size="small" />}
              label={<Typography variant="caption">DD.MM.YYYY</Typography>}
            />
            <FormControlLabel
              value="YYYY-MM-DD"
              control={<Radio size="small" />}
              label={<Typography variant="caption">YYYY-MM-DD</Typography>}
            />
          </RadioGroup>
        </FormControl>

        {/* Number Format */}
        <FormControl size="small" component="fieldset">
          <FormLabel sx={{ fontWeight: 600, mb: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {t('language.numberFormat', 'Number Format')}
            </Typography>
          </FormLabel>
          <RadioGroup
            value={userPreferences.numberFormat}
            onChange={(e) => handleNumberFormatChange(e.target.value as 'DE' | 'EN_US')}
            row
          >
            <FormControlLabel
              value="DE"
              control={<Radio size="small" />}
              label={<Typography variant="caption">1.234,56</Typography>}
            />
            <FormControlLabel
              value="EN_US"
              control={<Radio size="small" />}
              label={<Typography variant="caption">1,234.56</Typography>}
            />
          </RadioGroup>
        </FormControl>
      </Stack>
    </Box>
  );
}
