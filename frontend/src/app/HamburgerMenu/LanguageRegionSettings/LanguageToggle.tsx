/**
 * @file LanguageToggle.tsx
 * @module app/HamburgerMenu/LanguageRegionSettings/LanguageToggle
 *
 * @summary
 * Language selection toggle component displaying Deutsch/English options with flag icons.
 * Handles language switching via i18n integration and locale callback.
 *
 * @example
 * ```tsx
 * <LanguageToggle locale="de" onLocaleChange={handleChange} />
 * ```
 */

import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupportedLocale } from '../../../theme';

const DE_FLAG = '/flags/de.svg';
const US_FLAG = '/flags/us.svg';

interface LanguageToggleProps {
  /** Current locale setting (de or en) */
  locale: SupportedLocale;

  /** Callback fired when locale is changed */
  onLocaleChange: (locale: SupportedLocale) => void;
}

/**
 * Language toggle component with flag icons.
 *
 * @param props - Component props
 * @returns JSX element rendering language toggle buttons
 */
export default function LanguageToggle({
  locale,
  onLocaleChange,
}: LanguageToggleProps) {
  const { t, i18n } = useTranslation(['common']);

  const handleLanguageChange = (newLocale: SupportedLocale) => {
    onLocaleChange(newLocale);
    i18n.changeLanguage(newLocale);
  };

  return (
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
          }
        }}
        size="small"
        fullWidth
      >
        <ToggleButton value="de" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <img src={DE_FLAG} alt="Deutsch" width={14} height={14} />
          <Typography variant="caption">Deutsch</Typography>
        </ToggleButton>
        <ToggleButton value="en" sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <img src={US_FLAG} alt="English" width={14} height={14} />
          <Typography variant="caption">English</Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
