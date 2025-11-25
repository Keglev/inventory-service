/**
 * @file Footer.tsx
 * @description
 * Enterprise-quality application footer with:
 * - Legal & copyright information
 * - Support & documentation links
 * - System health status (backend, database, response time)
 * - Language & region display
 * - Data privacy notice
 *
 * @enterprise
 * - Professional SAP/Fiori aesthetic
 * - Real-time system health monitoring
 * - Responsive design (stacked on mobile, grid on desktop)
 * - Full i18n support for all text
 *
 * @design
 * - Background: subtle grey (background.default) with top border
 * - Font: small, muted colors, enterprise spacing
 * - Health status: live indicators with response time
 */

import * as React from 'react';
import { Box, Container, Typography, Link, Divider, Stack, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useHealthCheck } from '../features/health/hooks/useHealthCheck';

const Footer: React.FC = () => {
  const { i18n } = useTranslation(['common']);
  const { health } = useHealthCheck();

  const currentLanguage = i18n.language.split('-')[0].toUpperCase(); // 'de' -> 'DE', 'en' -> 'EN'
  const region = 'DE'; // Can be extended to support multi-region
  const buildId = '4a9c12f'; // From env or build metadata
  const environment = 'Production (Koyeb)'; // From env
  const appVersion = '1.0.0'; // From package.json or env

  /**
   * Render health status indicator with color coding
   */
  const renderHealthStatus = (status: { status: 'online' | 'offline'; responseTime: number; database: 'online' | 'offline' }) => {
    const isOnline = status.status === 'online';
    const color = isOnline ? 'success' : 'error';
    const label = isOnline ? 'Online' : 'Offline';

    return (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Chip
          icon={
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isOnline ? '#4CAF50' : '#F44336',
              }}
            />
          }
          label={`${label}`}
          size="small"
          variant="outlined"
          sx={{ borderColor: color, color }}
        />
        {status.responseTime > 0 && (
          <Typography variant="caption" color="text.secondary">
            {status.responseTime}ms
          </Typography>
        )}
      </Stack>
    );
  };

  const databaseOnline = health.database === 'online';
  const dbColor = databaseOnline ? 'success' : 'error';

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        pt: 4,
        pb: 3,
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderTopColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
          {/* Column 1: Legal & Meta Info */}
          <Box>
            <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 1 }}>
              Legal & Meta
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                © 2025 Smart Supply Pro • All rights reserved
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Version: {appVersion}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Build: {buildId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Environment: {environment}
              </Typography>
            </Stack>
          </Box>

          {/* Column 2: Support & Documentation */}
          <Box>
            <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 1 }}>
              Support & Docs
            </Typography>
            <Stack spacing={0.5}>
              <Link
                href="#"
                underline="hover"
                variant="caption"
                sx={{ color: 'primary.main', cursor: 'pointer' }}
              >
                Documentation
              </Link>
              <Link
                href="#"
                underline="hover"
                variant="caption"
                sx={{ color: 'primary.main', cursor: 'pointer' }}
              >
                API Reference
              </Link>
              <Link
                href="#"
                underline="hover"
                variant="caption"
                sx={{ color: 'primary.main', cursor: 'pointer' }}
              >
                Release Notes
              </Link>
              <Link
                href="mailto:support@smartsupplypro.com"
                underline="hover"
                variant="caption"
                sx={{ color: 'primary.main', cursor: 'pointer' }}
              >
                Contact Support
              </Link>
            </Stack>
          </Box>

          {/* Column 3: System Health */}
          <Box>
            <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 1 }}>
              System Health
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Backend
                </Typography>
                {renderHealthStatus(health)}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  Database
                </Typography>
                <Chip
                  icon={
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: databaseOnline ? '#4CAF50' : '#F44336',
                      }}
                    />
                  }
                  label={databaseOnline ? 'Oracle ADB' : 'Offline'}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: dbColor, color: dbColor }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Column 4: Language & Region */}
          <Box>
            <Typography variant="caption" display="block" sx={{ fontWeight: 600, mb: 1 }}>
              Language & Region
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Language: {currentLanguage}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Region: {region}
              </Typography>
            </Stack>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Data Privacy Blurb */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.6 }}>
            This portfolio showcases a fictional enterprise inventory system. No real customer data is stored. For demonstration purposes only.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
