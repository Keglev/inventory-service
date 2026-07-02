/**
 * @file SystemPreferencesSection.tsx
 * @module app/settings/sections/SystemPreferencesSection
 *
 * @summary
 * System information and preferences display section component.
 * Shows database, environment, version, status, and build date information.
 *
 * @enterprise
 * - Read-only display: data is fetched by useSettings, surfaced here without user interaction
 * - Source of truth for runtime environment; helps users confirm which backend/DB the UI is talking to
 */

import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SystemInfo } from '../../../context/settings';
import { APP_VERSION, BUILD_ID } from '../../../config/appMeta';

interface SystemPreferencesSectionProps {
  /** System information data */
  systemInfo: SystemInfo | null;

  /** Whether system info is currently loading */
  isLoading: boolean;
}

/**
 * System preferences section component.
 *
 * Displays read-only system information including database, environment,
 * version, status, and build date. Shows loading spinner while fetching.
 *
 * @param props - Component props
 * @returns JSX element rendering system information display
 *
 * @example
 * ```tsx
 * <SystemPreferencesSection
 *   systemInfo={{ database: 'Oracle', environment: 'production', ... }}
 *   isLoading={false}
 * />
 * ```
 */
export default function SystemPreferencesSection({
  systemInfo,
  isLoading,
}: SystemPreferencesSectionProps) {
  const { t } = useTranslation(['common']);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!systemInfo) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('settings.systemInfoUnavailable', 'System information unavailable')}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.database', 'Database')}
        </Typography>
        <Typography variant="body2">{systemInfo.database}</Typography>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.environment', 'Environment')}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          {/* 'error' (red) for production is intentional — a caution signal; non-prod gets 'success' (green). Inverted on purpose, not a bug. */}
          <Chip
            label={systemInfo.environment}
            size="small"
            color={systemInfo.environment === 'production' ? 'error' : 'success'}
            variant="outlined"
          />
        </Box>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.version', 'Version')}
        </Typography>
        <Typography variant="body2">{APP_VERSION}</Typography>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.status', 'Status')}
        </Typography>
        <Typography variant="body2">{systemInfo.status}</Typography>
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.build', 'Build')}
        </Typography>
        <Typography variant="body2">{BUILD_ID}</Typography>
      </Box>
    </Stack>
  );
}
