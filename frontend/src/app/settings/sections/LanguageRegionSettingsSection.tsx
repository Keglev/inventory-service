/**
 * @file LanguageRegionSettingsSection.tsx
 * @module app/settings/sections/LanguageRegionSettingsSection
 *
 * @summary
 * Language and region settings section component.
 * Manages date format and number format preferences with preview examples.
 *
 * @enterprise
 * - Focused on language and region settings
 * - Real-time preview examples for date and number formats
 * - Radio button groups for format selection
 * - i18n support for labels and descriptions
 * - Type-safe format selection
 * - Full TypeDoc coverage for locale settings
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
import { formatDate, formatNumber } from '../../../utils/formatters';
import type { DateFormat, NumberFormat } from '../../../context/settings';

interface LanguageRegionSettingsSectionProps {
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
  dateFormat,
  onDateFormatChange,
  numberFormat,
  onNumberFormatChange,
}: LanguageRegionSettingsSectionProps) {
  const { t } = useTranslation(['common']);

  return (
    <Stack spacing={2}>
      {/* Date Format Selector */}
      <FormControl>
        <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
          {t('settings.dateFormat', 'Date Format')}
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

      {/* Number Format Selector */}
      <FormControl>
        <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
          {t('settings.numberFormat', 'Number Format')}
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
                <Typography variant="body2">German (DE)</Typography>
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
                <Typography variant="body2">English (US)</Typography>
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
