/**
 * @file FooterMetaInfo.tsx
 * @module app/footer/FooterMetaInfo
 *
 * @summary
 * Footer metadata information component.
 * Displays version, build ID, environment, language, and region information.
 *
 * @enterprise
 * - Version and build tracking display
 * - Environment identification
 * - Language and region display
 * - i18n support for all labels
 * - Compact metadata presentation
 * - Full TypeDoc coverage for meta information
 */

import { Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface FooterMetaInfoProps {
  /** Application version number */
  appVersion: string;

  /** Build ID or commit hash */
  buildId: string;

  /** Environment name (e.g., "Production (Koyeb)") */
  environment: string;

  /** Current language code (e.g., "EN", "DE") */
  currentLanguage: string;

  /** Current region code (e.g., "DE") */
  region: string;
}

/**
 * Footer metadata information component.
 *
 * Displays version, build, environment, language, and region.
 * Compact display suitable for footer status bar.
 *
 * @param props - Component props
 * @returns JSX element rendering metadata information
 *
 * @example
 * ```tsx
 * <FooterMetaInfo
 *   appVersion="1.0.0"
 *   buildId="4a9c12f"
 *   environment="Production (Koyeb)"
 *   currentLanguage="EN"
 *   region="DE"
 * />
 * ```
 */
export default function FooterMetaInfo({
  appVersion,
  buildId,
  environment,
  currentLanguage,
  region,
}: FooterMetaInfoProps) {
  const { t } = useTranslation(['footer']);

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ flexShrink: 0 }}
    >
      {/* Compact meta string for status bar */}
      <Typography
        variant="caption"
        color="text.secondary"
        noWrap
        sx={{ maxWidth: { xs: '100%', sm: '60%' } }}
      >
        © 2025 Smart Supply Pro • v{appVersion} • {t('footer:meta.build', 'Build')} {buildId} •{' '}
        {environment} • {t('footer:meta.demoData', 'Demo data only')}
      </Typography>

      {/* Language and Region */}
      <Typography variant="caption" color="text.secondary">
        {currentLanguage}-{region}
      </Typography>
    </Stack>
  );
}
