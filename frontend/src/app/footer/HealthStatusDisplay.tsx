/**
 * @file HealthStatusDisplay.tsx
 * @module app/footer/HealthStatusDisplay
 *
 * @summary
 * System health status display component.
 * Shows backend and database status with real-time response time information.
 *
 * @enterprise
 * - Pure presentational leaf: props-only, no state. Receives a HealthStatus prop
 *   sourced from useFooterState (which reads it from useHealthCheck).
 * - Local HealthStatus interface duplicates the exported one in
 *   features/health/hooks/useHealthCheck.ts; barrel gap: features/health/index.ts
 *   does not re-export the type (see ST-APP1).
 * - 'Online'/'Oracle ADB' labels are hardcoded; 'Offline' is translated. Status-dot
 *   colors use raw hex while Chip borders use theme tokens (see CB-APP3).
 */

import { Box, Chip, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

// BUCKET: (ST-APP1) import HealthStatus from features/health barrel once it re-exports
//         the type; drop this local duplicate.
interface HealthStatus {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
}

interface HealthStatusDisplayProps {
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
 * <HealthStatusDisplay health={{ status: 'online', responseTime: 125, database: 'online' }} />
 * ```
 */
export default function HealthStatusDisplay({ health }: HealthStatusDisplayProps) {
  const { t } = useTranslation(['footer']);

  const backendOnline = health.status === 'online';
  const databaseOnline = health.database === 'online';
  const backendColor = backendOnline ? 'success' : 'error';
  const dbColor = databaseOnline ? 'success' : 'error';

  return (
    <>
      {/* Backend Status */}
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mb: 0.25 }}
        >
          {t('footer:health.backend', 'Backend')}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Chip
            icon={
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: backendOnline ? '#4CAF50' : '#F44336', // BUCKET: (CB-APP3) use theme palette (success.main / error.main)
                }}
              />
            }
            label={backendOnline ? 'Online' : t('footer:status.offline', 'Offline')} // BUCKET: (CB-APP3) 'Online' hardcoded — use i18n key
            size="small"
            variant="outlined"
            sx={{ borderColor: backendColor, color: backendColor }}
          />
          {health.responseTime > 0 && (
            <Typography variant="caption" color="text.secondary">
              {health.responseTime}ms
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Database Status */}
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          sx={{ mt: 0.5, mb: 0.25 }}
        >
          {t('footer:health.database', 'Database')}
        </Typography>
        <Chip
          icon={
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: databaseOnline ? '#4CAF50' : '#F44336', // BUCKET: (CB-APP3) use theme palette (success.main / error.main)
              }}
            />
          }
          label={databaseOnline ? 'Oracle ADB' : t('footer:status.offline', 'Offline')} // BUCKET: (CB-APP3) 'Oracle ADB' hardcoded — use i18n key
          size="small"
          variant="outlined"
          sx={{ borderColor: dbColor, color: dbColor }}
        />
      </Box>
    </>
  );
}
