/**
 * @file FooterMetaInfo.tsx
 * @module app/footer/FooterMetaInfo
 *
 * @summary
 * Footer metadata information component.
 * One compact line: year, version, short build id, demo-data note.
 *
 * @enterprise
 * - Pure presentational leaf: props-only, no state. Compact status bar variant
 *   of the expanded footer metadata.
 * - FW5 fork 3: the footer keeps a compact line; environment, backend status and
 *   the full build hash live in the About dialog. The first 10 characters of
 *   the build id still match a deploy to its commit; the full hash is in the
 *   title attribute, and the deploy check reads it from the bundle, not here.
 * - The group may shrink so that on a narrow screen the line wraps inside the
 *   footer rather than overflowing it.
 * - Props come from useFooterState (build-time values from config/appMeta).
 */

import { Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface FooterMetaInfoProps {
  /** Application version number */
  appVersion: string;

  /** Build ID or commit hash */
  buildId: string;
}

/**
 * Footer metadata information component.
 *
 * Displays year, version, short build id and the demo-data note.
 *
 * @param props - Component props
 * @returns JSX element rendering metadata information
 *
 * @example
 * ```tsx
 * <FooterMetaInfo
 *   appVersion="1.0.0"
 *   buildId="31833c2f6d51eb2aebbfef1e3e212632bf6fd6b6"
 * />
 * ```
 */
export default function FooterMetaInfo({
  appVersion,
  buildId,
}: FooterMetaInfoProps) {
  const { t } = useTranslation(['footer']);

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      {/* Compact meta string for status bar */}
      <Typography variant="caption" color="text.secondary">
        © {new Date().getFullYear()} Smart Supply Pro • v{appVersion} • {t('footer:meta.build')}{' '}
        <span title={buildId}>{buildId.slice(0, 10)}</span> • {t('footer:meta.demoData')}
      </Typography>
    </Stack>
  );
}
