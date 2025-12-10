/**
 * @file HealthBadge.tsx
 * @module app/layout/header/HealthBadge
 *
 * @summary
 * System health status indicator badge component.
 * Displays backend and database status with color-coded visual feedback.
 *
 * @enterprise
 * - Real-time health status monitoring
 * - Color-coded status (success/warning/error)
 * - Responsive visibility (hidden on xs, shown on sm+)
 * - Detailed tooltip with status explanation
 * - Full TypeDoc coverage for health monitoring
 */

import { Box, Chip, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useHealthCheck } from '../../../features/health';

/**
 * Health status badge component.
 *
 * Monitors backend and database connectivity status.
 * Displays color-coded indicator with tooltip showing detailed status.
 *
 * @returns JSX element rendering health status badge (hidden on xs screens)
 *
 * @example
 * ```tsx
 * <HealthBadge />
 * // Shows: Green badge "System OK" when all online
 * // Shows: Orange badge "Degraded" when backend ok but DB down
 * // Shows: Red badge "Offline" when backend unreachable
 * ```
 */
export default function HealthBadge() {
  const { t } = useTranslation(['common']);
  const { health } = useHealthCheck();

  // Determine backend and database status
  const backendOnline = health.status === 'online';
  const dbOnline = health.database === 'online';
  const allOk = backendOnline && dbOnline;

  // Map health status to color tone for badge styling
  const healthTone: 'success' | 'warning' | 'error' =
    allOk ? 'success' : backendOnline ? 'warning' : 'error';

  // Determine health label based on status
  const healthLabel = allOk
    ? t('app.health.okLabel', 'System OK')
    : backendOnline
    ? t('app.health.degradedLabel', 'Degraded')
    : t('app.health.downLabel', 'Offline');

  // Determine health tooltip based on status
  const healthTooltip = allOk
    ? t('app.health.okTooltip', 'Backend & database online')
    : backendOnline && !dbOnline
    ? t('app.health.dbDownTooltip', 'Database reachable, DB issue')
    : t('app.health.downTooltip', 'Backend not reachable');

  // Map health tone to text color
  const healthTextColor =
    healthTone === 'success' ? '#1b5e20' : healthTone === 'warning' ? '#e65100' : '#b71c1c';

  return (
    <Box
      sx={{
        mr: 2,
        display: { xs: 'none', sm: 'flex' },
        alignItems: 'center',
      }}
    >
      <Tooltip title={healthTooltip}>
        <Chip
          size="small"
          color={healthTone}
          variant="outlined"
          icon={
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor:
                  healthTone === 'success'
                    ? 'success.main'
                    : healthTone === 'warning'
                    ? 'warning.main'
                    : 'error.main',
              }}
            />
          }
          label={healthLabel}
          sx={{
            '& .MuiChip-icon': {
              mr: 0.5,
            },
            fontWeight: 700,
            '& .MuiChip-label': {
              fontWeight: 700,
              color: healthTextColor,
            },
          }}
        />
      </Tooltip>
    </Box>
  );
}
