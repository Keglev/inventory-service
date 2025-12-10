/**
 * @file LocalizationDisplay.tsx
 * @module app/footer/LocalizationDisplay
 *
 * @summary
 * Localization information display component.
 * Shows current language and region settings.
 *
 * @enterprise
 * - Language and region display
 * - i18n support for labels
 * - Compact display format
 * - Full TypeDoc coverage for localization display
 */

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface LocalizationDisplayProps {
  /** Current language code (e.g., "EN", "DE") */
  currentLanguage: string;

  /** Current region code (e.g., "DE") */
  region: string;
}

/**
 * Localization display component.
 *
 * Shows current language and region settings.
 * Isolated from other footer sections for independent testing.
 *
 * @param props - Component props
 * @returns JSX element rendering language and region information
 *
 * @example
 * ```tsx
 * <LocalizationDisplay currentLanguage="EN" region="DE" />
 * ```
 */
export default function LocalizationDisplay({
  currentLanguage,
  region,
}: LocalizationDisplayProps) {
  const { t } = useTranslation(['footer']);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}
      >
        {t('footer:section.localization', 'Language & Region')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {t('footer:locale.language', 'Language')}: {currentLanguage}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {t('footer:locale.region', 'Region')}: {region}
      </Typography>
    </Box>
  );
}
