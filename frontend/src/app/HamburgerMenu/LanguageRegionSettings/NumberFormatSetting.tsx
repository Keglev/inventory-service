/**
 * @file NumberFormatSetting.tsx
 * @module app/HamburgerMenu/LanguageRegionSettings/NumberFormatSetting
 *
 * @summary
 * Controlled number-format radio picker (DE: 1.234,56 / EN_US: 1,234.56).
 *
 * @enterprise
 * - Controlled component: accepts `numberFormat` + `onChange`; no local state;
 *   persistence is owned by the parent section coordinator (LanguageRegionMenuSection).
 *
 * @example
 * ```tsx
 * <NumberFormatSetting numberFormat="DE" onChange={handleChange} />
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

interface NumberFormatSettingProps {
  numberFormat: string;
  onChange: (newFormat: 'DE' | 'EN_US') => void;
}

export default function NumberFormatSetting({
  numberFormat,
  onChange,
}: NumberFormatSettingProps) {
  const { t } = useTranslation(['common']);

  return (
    <FormControl size="small" component="fieldset" fullWidth>
      <FormLabel sx={{ fontWeight: 600, mb: 0.75 }}>
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          {t('language.numberFormat', 'Number Format')}
        </Typography>
      </FormLabel>
      <RadioGroup
        value={numberFormat === 'DE' || numberFormat === 'EN_US' ? numberFormat : 'DE'}
        onChange={(e) => onChange(e.target.value as 'DE' | 'EN_US')}
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
  );
}
