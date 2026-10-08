/**
 * @file LanguageRegionSettingsSection.tsx
 * @module app/settings/sections/LanguageRegionSettingsSection
 *
 * @summary
 * Language and region settings section component.
 * UI language, date format and number format, with preview examples.
 *
 * @enterprise
 * - The only editor for the UI language in the app shell (FW5 forks 1 and 2);
 *   language names stay in their own language (W3C i18n), not translated
 * - Live preview examples surface formatter output directly, making format choices self-documenting in the UI
 */

import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Typography,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupportedLocale } from '../../../theme';
import { formatDate, formatNumber } from '../../../utils/formatters';
import type { DateFormat, NumberFormat } from '../../../context/settings/SettingsContext.types';

interface LanguageRegionSettingsSectionProps {
  /** Current UI language */
  locale: SupportedLocale;

  /** Callback when the UI language changes */
  onLocaleChange: (locale: SupportedLocale) => void;

  /** Current date format value */
  dateFormat: DateFormat;

  /** Callback when date format changes */
  onDateFormatChange: (format: DateFormat) => void;

  /** Current number format value */
  numberFormat: NumberFormat;

  /** Callback when number format changes */
  onNumberFormatChange: (format: NumberFormat) => void;
}

/**
 * Language and region settings section component.
 *
 * Provides date format and number format selectors with live preview examples.
 * Isolated from other settings for independent testing and reuse.
 *
 * @param props - Component props
 * @returns JSX element rendering language and region settings controls
 *
 * @example
 * ```tsx
 * <LanguageRegionSettingsSection
 *   dateFormat="DD.MM.YYYY"
 *   onDateFormatChange={handleDateChange}
 *   numberFormat="DE"
 *   onNumberFormatChange={handleNumberChange}
 * />
 * ```
 */
export default function LanguageRegionSettingsSection({
  locale,
  onLocaleChange,
  dateFormat,
  onDateFormatChange,
  numberFormat,
  onNumberFormatChange,
}: LanguageRegionSettingsSectionProps) {
  const { t } = useTranslation(['common']);

  return (
    <Stack spacing={2}>
      <FormControl>
        <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
          {t('settings.language')}
        </FormLabel>
        {/* WHY: language names stay in their own language (W3C i18n) so a user who
            cannot read the current UI still finds theirs. */}
        <RadioGroup
          value={locale}
          onChange={(e) => void onLocaleChange(e.target.value as SupportedLocale)}
        >
          <FormControlLabel value="de" control={<Radio size="small" />} label="Deutsch" lang="de" />
          <FormControlLabel value="en" control={<Radio size="small" />} label="English" lang="en" />
        </RadioGroup>
      </FormControl>
      <FormControl>
        <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
          {t('settings.dateFormat')}
        </FormLabel>
        <RadioGroup
          value={dateFormat}
          onChange={(e) => onDateFormatChange(e.target.value as DateFormat)}
        >
          <FormControlLabel
            value="DD.MM.YYYY"
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography variant="body2">DD.MM.YYYY</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(new Date(), 'DD.MM.YYYY')}
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="YYYY-MM-DD"
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography variant="body2">YYYY-MM-DD</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(new Date(), 'YYYY-MM-DD')}
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="MM/DD/YYYY"
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography variant="body2">MM/DD/YYYY</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(new Date(), 'MM/DD/YYYY')}
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>

      <FormControl>
        <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
          {t('settings.numberFormat')}
        </FormLabel>
        <RadioGroup
          value={numberFormat}
          onChange={(e) => onNumberFormatChange(e.target.value as NumberFormat)}
        >
          <FormControlLabel
            value="DE"
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography variant="body2">{t('settings.numberFormatDe')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatNumber(1234.56, 'DE')}
                </Typography>
              </Box>
            }
          />
          <FormControlLabel
            value="EN_US"
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography variant="body2">{t('settings.numberFormatEnUs')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatNumber(1234.56, 'EN_US')}
                </Typography>
              </Box>
            }
          />
        </RadioGroup>
      </FormControl>
    </Stack>
  );
}
