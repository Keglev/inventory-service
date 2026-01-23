/**
 * @file SystemInfoMenuSection.tsx
 * @module app/HamburgerMenu/SystemInfoMenuSection
 *
 * @summary
 * System Information section displaying environment, backend URL, and frontend version.
 */

import * as React from 'react';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useTranslation } from 'react-i18next';
import { useHealthCheck } from '../../features/health';

type ClipboardLike = Pick<Clipboard, 'writeText'>;

interface SystemInfoMenuSectionProps {
  /** Dependency injection hook for clipboard; defaults to global navigator.clipboard */
  clipboard?: ClipboardLike | null;
}

export default function SystemInfoMenuSection({ clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : null }: SystemInfoMenuSectionProps) {
  const { t } = useTranslation(['common']);
  const { health } = useHealthCheck();
  const [copied, setCopied] = React.useState(false);

  // System info (from footer and environment)
  const environment = 'Production (Koyeb)';
  const backendUrl = '/api'; // Can be enhanced to show full URL
  const frontendVersion = '1.0.0';
  const commitHash = '4a9c12f';

  const handleCopyUrl = async (text: string) => {
    if (!clipboard || typeof clipboard.writeText !== 'function') {
      console.warn('Clipboard API not available');
      return;
    }

    try {
      await clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Copy to clipboard failed', error);
    }
  };

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('systemInfo.title', 'Systeminfo / System Info')}
      </Typography>

      <Stack spacing={1}>
        {/* Environment */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
            {t('systemInfo.environment', 'Environment')}
          </Typography>
          <Typography variant="body2">{environment}</Typography>
        </Box>

        {/* Backend Status & URL */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}>
            {t('systemInfo.backend', 'Backend')}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                wordBreak: 'break-all',
              }}
            >
              {backendUrl}
            </Typography>
            <Tooltip title={copied ? t('systemInfo.copied', 'Copied!') : t('systemInfo.copy', 'Copy')}>
              <IconButton
                size="small"
                onClick={() => handleCopyUrl(backendUrl)}
                sx={{ p: 0.25, minWidth: 'auto' }}
              >
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
            {health.status === 'online'
              ? t('systemInfo.backendOnline', 'Status: Online')
              : t('systemInfo.backendOffline', 'Status: Offline')}
          </Typography>
        </Box>

        {/* Frontend Version & Build */}
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
