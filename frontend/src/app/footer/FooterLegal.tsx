/**
 * @file FooterLegal.tsx
 * @module app/footer/FooterLegal
 *
 * @summary
 * Footer legal and copyright information component.
 * Displays copyright, version, build ID, and environment metadata.
 *
 * @enterprise
 * - Legal and meta information display
 * - Version and build tracking
 * - Environment identification
 * - i18n support for all text
 * - Full TypeDoc coverage for legal section
 */

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface FooterLegalProps {
  /** Application version number */
  appVersion: string;

  /** Build ID or commit hash */
  buildId: string;

  /** Environment name (e.g., "Production (Koyeb)") */
  environment: string;
}

/**
 * Footer legal and meta information component.
 *
 * Displays copyright notice, version, build ID, and environment information.
 * Isolated from other footer sections for independent testing and reuse.
 *
 * @param props - Component props
 * @returns JSX element rendering legal and meta information
 *
 * @example
 * ```tsx
 * <FooterLegal
 *   appVersion="1.0.0"
 *   buildId="4a9c12f"
 *   environment="Production (Koyeb)"
 * />
 * ```
 */
export default function FooterLegal({
  appVersion,
  buildId,
  environment,
}: FooterLegalProps) {
  const { t } = useTranslation(['footer']);

  return (
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}
      >
        {t('footer:section.legal', 'Legal & Meta')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        © 2025 Smart Supply Pro • {t('footer:legal.rights', 'All rights reserved')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {t('footer:meta.version', 'Version')}: {appVersion} • {t('footer:meta.build', 'Build')}: {buildId}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {t('footer:meta.environment', 'Environment')}: {environment}
      </Typography>
    </Box>
  );
}
