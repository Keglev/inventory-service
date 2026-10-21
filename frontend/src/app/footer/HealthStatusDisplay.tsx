/**
 * @file HealthStatusDisplay.tsx
 * @module app/footer/HealthStatusDisplay
 *
 * @summary
 * System health status display component. Renders backend and database status
 * as a single compact inline row (one flex child) so the footer stays one line
 * tall; the backend response time appears inline when meaningful.
 *
 * @enterprise
 * - Pure presentational leaf: props-only, no state. Receives a HealthStatus prop
 *   sourced from useFooterState (which reads it from useHealthCheck).
 * - HealthStatus is imported from the features/health barrel (single source
 *   of truth in useHealthCheck). The component reads status, responseTime,
 *   database and databaseProduct; the timestamp field is unused here.
 * - The database chip shows the product name the backend reports (the same value
 *   as the About dialog), not a fixed label (FW5 fork 3).
 * - All labels resolve via the footer i18n namespace; the "Backend"/"Database"
 *   captions are chip tooltips (title) rather than visible text to keep the row
 *   compact. Status dots, Chip borders and labels use the success/error palette
 *   steps that keep their contrast on the footer surface in both modes.
 */

import { Box, Chip, Stack, Typography } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import type { HealthStatus } from '../../features/health/hooks/useHealthCheck';

export interface HealthStatusDisplayProps {
  /** Health status data */
  health: HealthStatus;
}

/**
 * Health status display component.
 *
 * Shows backend and database status with visual indicators.
 * Displays response time for backend status.
 *
 * @param props - Component props
 * @returns JSX element rendering health status display
 *
 * @example
 * ```tsx
 * <HealthStatusDisplay health={{ status: 'online', responseTime: 125, database: 'online', timestamp: 0 }} />
 * ```
 */
export default function HealthStatusDisplay({ health }: HealthStatusDisplayProps) {
  const { t } = useTranslation(['footer']);

  const backendOnline = health.status === 'online';
  const databaseOnline = health.database === 'online';
  const backendColor = backendOnline ? 'success' : 'error';
  const dbColor = databaseOnline ? 'success' : 'error';

  // A bare palette name ('success') never resolved in sx, so the chips drew in
  // neutral grey. Border in the main step; text in the step that keeps 4.5:1 on
  // the footer surface (dark in light mode, light in dark mode).
  const chipSx = (tone: 'success' | 'error') => ({
    borderColor: `${tone}.main`,
    color: (theme: Theme) => (theme.palette.mode === 'light' ? theme.palette[tone].dark : theme.palette[tone].light),
  });

  const statusDot = (online: boolean) => (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: online ? 'success.main' : 'error.main',
      }}
    />
  );

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
      {/* Backend: chip + inline response time. Caption lives in the tooltip. */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Chip
          title={t('footer:health.backend')}
          icon={statusDot(backendOnline)}
          label={backendOnline ? t('footer:status.online') : t('footer:status.offline')}
          size="small"
          variant="outlined"
          sx={chipSx(backendColor)}
        />
        {health.responseTime > 0 && (
          <Typography variant="caption" color="text.secondary">
            {health.responseTime}ms
          </Typography>
        )}
      </Stack>

      {/* Database: chip. Caption lives in the tooltip. */}
      <Chip
        title={t('footer:health.database')}
        icon={statusDot(databaseOnline)}
        label={databaseOnline ? (health.databaseProduct ?? t('footer:status.online')) : t('footer:status.offline')}
        size="small"
        variant="outlined"
        sx={chipSx(dbColor)}
      />
    </Stack>
  );
}
