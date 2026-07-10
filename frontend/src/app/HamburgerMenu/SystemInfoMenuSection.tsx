/**
 * @file SystemInfoMenuSection.tsx
 * @module app/HamburgerMenu/SystemInfoMenuSection
 *
 * @summary
 * System info section coordinator; reads backend health status from
 * useHealthCheck and displays environment, backend status, and frontend
 * build info.
 *
 * @enterprise
 * Data origin: features/health (useHealthCheck) for backend online/offline
 * status; all other values come from config/appMeta.
 * The former backend URL row ('/api' + copy-to-clipboard) was removed
 * (CB-APP80): the relative path carried no user value and read like a broken
 * link. The clipboard dependency-injection prop went with it.
 * Mounted exclusively by MenuContent/MenuSectionsRenderer.
 */

import {
  Box,
  Typography,
  Stack,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useHealthCheck } from '../../features/health/hooks/useHealthCheck';
import { APP_ENVIRONMENT, APP_VERSION, BUILD_ID } from '../../config/appMeta';

export default function SystemInfoMenuSection() {
  const { t } = useTranslation(['common']);
  const { health } = useHealthCheck();

  const environment = APP_ENVIRONMENT;
  const frontendVersion = APP_VERSION;
  const commitHash = BUILD_ID;

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('systemInfo.title', 'Systeminfo / System Info')}
      </Typography>

      <Stack spacing={1}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
            {t('systemInfo.environment', 'Environment')}
          </Typography>
          <Typography variant="body2">{environment}</Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
            {t('systemInfo.backend', 'Backend')}
          </Typography>
          <Typography variant="body2">
            {health.status === 'online'
              ? t('systemInfo.backendOnline', 'Status: Online')
              : t('systemInfo.backendOffline', 'Status: Offline')}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
            {t('systemInfo.frontend', 'Frontend')}
          </Typography>
          <Typography variant="body2">
            {t('systemInfo.version', 'Version')}: {frontendVersion}
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {t('systemInfo.build', 'Build')}: {commitHash}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
