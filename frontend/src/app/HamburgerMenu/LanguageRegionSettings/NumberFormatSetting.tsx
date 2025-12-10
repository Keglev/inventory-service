/**
 * @file NumberFormatSetting.tsx
 * @module app/HamburgerMenu/LanguageRegionSettings/NumberFormatSetting
 *
 * @summary
 * Number format setting component allowing selection between German (1.234,56) and US (1,234.56) styles.
 * Persists preference via useSettings hook.
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
  /** Current number format setting (DE for German or EN_US for US style) */
  numberFormat: string;

  /** Callback fired when number format is changed */
  onChange: (newFormat: 'DE' | 'EN_US') => void;
}

/**
 * Number format radio selection component.
 *
 * Provides two standard number format options with visual examples:
 * - DE: German style (1.234,56)
 * - EN_US: US style (1,234.56)
 *
 * @param props - Component props
 * @returns JSX element rendering number format radio buttons
 */
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
