/**
 * @file DateFormatSetting.tsx
 * @module app/HamburgerMenu/LanguageRegionSettings/DateFormatSetting
 *
 * @summary
 * Controlled date-format radio picker (DD.MM.YYYY / YYYY-MM-DD).
 *
 * @enterprise
 * - Controlled component: accepts `dateFormat` + `onChange`; no local state;
 *   persistence is owned by the parent section coordinator (LanguageRegionMenuSection).
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
  dateFormat: string;
  onChange: (newFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD') => void;
}

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
