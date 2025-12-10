/**
 * @file DateFormatSetting.tsx
 * @module app/HamburgerMenu/LanguageRegionSettings/DateFormatSetting
 *
 * @summary
 * Date format setting component allowing selection between DD.MM.YYYY and YYYY-MM-DD formats.
 * Persists preference via useSettings hook.
 *
 * @example
 * ```tsx
 * <DateFormatSetting dateFormat="DD.MM.YYYY" onChange={handleChange} />
 * ```
 */

import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DateFormatSettingProps {
  /** Current date format setting (DD.MM.YYYY or YYYY-MM-DD) */
  dateFormat: string;

  /** Callback fired when date format is changed */
  onChange: (newFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD') => void;
}

/**
 * Date format radio selection component.
 *
 * Provides two standard date format options with visual examples.
 *
 * @param props - Component props
 * @returns JSX element rendering date format radio buttons
 */
export default function DateFormatSetting({
  dateFormat,
  onChange,
}: DateFormatSettingProps) {
  const { t } = useTranslation(['common']);

  return (
    <FormControl size="small" component="fieldset" fullWidth>
      <FormLabel sx={{ fontWeight: 600, mb: 0.75 }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {t('language.dateFormat', 'Date Format')}
        </Typography>
      </FormLabel>
      <RadioGroup
        value={dateFormat === 'DD.MM.YYYY' || dateFormat === 'YYYY-MM-DD' ? dateFormat : 'DD.MM.YYYY'}
        onChange={(e) => onChange(e.target.value as 'DD.MM.YYYY' | 'YYYY-MM-DD')}
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
  );
}
