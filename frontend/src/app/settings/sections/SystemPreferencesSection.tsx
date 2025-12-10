/**
 * @file SystemPreferencesSection.tsx
 * @module app/settings/sections/SystemPreferencesSection
 *
 * @summary
 * System information and preferences display section component.
 * Shows database, environment, version, status, and build date information.
 *
 * @enterprise
 * - Displays read-only system information
 * - Loading state with spinner
 * - Color-coded environment badge (production vs others)
 * - Graceful fallback for unavailable system info
 * - i18n support for labels
 * - Full TypeDoc coverage for system preferences display
 */

import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface SystemInfo {
  database: string;
  environment: string;
  version: string;
  status: string;
  buildDate: string;
}

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
      {/* Database Information */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.database', 'Database')}
        </Typography>
        <Typography variant="body2">{systemInfo.database}</Typography>
      </Box>

      {/* Environment Information */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.environment', 'Environment')}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <Chip
            label={systemInfo.environment}
            size="small"
            color={systemInfo.environment === 'production' ? 'error' : 'success'}
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Version Information */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.version', 'Version')}
        </Typography>
        <Typography variant="body2">{systemInfo.version}</Typography>
      </Box>

      {/* Status Information */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.status', 'Status')}
        </Typography>
        <Typography variant="body2">{systemInfo.status}</Typography>
      </Box>

      {/* Build Date Information */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {t('settings.buildDate', 'Build Date')}
        </Typography>
        <Typography variant="body2">{systemInfo.buildDate}</Typography>
      </Box>
    </Stack>
  );
}
