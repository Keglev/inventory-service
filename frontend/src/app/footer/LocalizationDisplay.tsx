/**
 * @file LocalizationDisplay.tsx
 * @module app/footer/LocalizationDisplay
 *
 * @summary
 * Localization information display component.
 * Shows current language and region settings.
 *
 * @enterprise
 * - Pure presentational leaf: props-only, no state. Receives currentLanguage/region from
 *   useFooterState — region is the static 'DE' originating from hardcoded config (see
 *   CB-APP1); currentLanguage is i18n-derived.
 * - Isolated from the other footer sections so it can be unit-tested standalone.
 * - Labels are i18n keys in the 'footer' namespace with English fallbacks.
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
