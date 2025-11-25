/**
 * @file Footer.tsx
 * @description
 * Enterprise-quality collapsible application footer with:
 * - Legal & copyright information
 * - Support & documentation links
 * - System health status (backend, database, response time)
 * - Language & region display
 * - Data privacy notice
 *
 * @enterprise
 * - Professional SAP/Fiori aesthetic
 * - Real-time system health monitoring
 * - Collapsible sections (click title to expand/collapse)
 * - Full i18n support for all text
 */
import * as React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  Stack,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import { useHealthCheck } from '../features/health/hooks/useHealthCheck';

const Footer: React.FC = () => {
  const { i18n, t } = useTranslation(['common', 'footer']);
  const { health } = useHealthCheck();

  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const currentLanguage = i18n.language.split('-')[0].toUpperCase();
  const region = 'DE';
  const buildId = '4a9c12f';
  const environment = 'Production (Koyeb)';
  const appVersion = '1.0.0';

  const toggleDetails = () => setDetailsOpen((prev) => !prev);

  const renderHealthStatus = (status: {
    status: 'online' | 'offline';
    responseTime: number;
    database: 'online' | 'offline';
  }) => {
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
                bgcolor: isOnline ? '#4CAF50' : '#F44336',
              }}
            />
          }
          label={label}
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
        borderTop: '1px solid',
        borderTopColor: 'divider',
        bgcolor: 'background.default',
        // OPTIONAL: uncomment and adjust if you want the footer to sit
        // to the right of a fixed 240px sidebar on desktop:
        // ml: { md: '240px' },
        // zIndex a bit below the app bar / drawer
        zIndex: (theme) => theme.zIndex.appBar - 1,
      }}
    >
      <Container maxWidth="xl" sx={{ py: 0.5 }}>
        {/* EXPANDED DETAILS PANEL (collapses away on login/logout screens) */}
        <Collapse in={detailsOpen} unmountOnExit>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 0.75 }}
          >
            {/* Legal & Meta */}
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

            {/* Support & Docs */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}
              >
                {t('footer:section.support', 'Support & Docs')}
              </Typography>
              <Stack spacing={0.25}>
                <Link
                  href="#"
                  underline="hover"
                  variant="caption"
                  sx={{ color: 'primary.main' }}
                >
                  {t('footer:support.documentation', 'Documentation')}
                </Link>
                <Link
                  href="#"
                  underline="hover"
                  variant="caption"
                  sx={{ color: 'primary.main' }}
                >
                  {t('footer:support.apiRef', 'API Reference')}
                </Link>
                <Link
                  href="#"
                  underline="hover"
                  variant="caption"
                  sx={{ color: 'primary.main' }}
                >
                  {t('footer:support.releaseNotes', 'Release Notes')}
                </Link>
                <Link
                  href="mailto:support@smartsupplypro.com"
                  underline="hover"
                  variant="caption"
                  sx={{ color: 'primary.main' }}
                >
                  {t('footer:support.contact', 'Contact Support')}
                </Link>
              </Stack>
            </Box>

            {/* System Health */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}
              >
                {t('footer:section.health', 'System Health')}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.25 }}
              >
                {t('footer:health.backend', 'Backend')}
              </Typography>
              {renderHealthStatus(health)}
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
                      bgcolor: databaseOnline ? '#4CAF50' : '#F44336',
                    }}
                  />
                }
                label={databaseOnline ? 'Oracle ADB' : t('footer:status.offline', 'Offline')}
                size="small"
                variant="outlined"
                sx={{ borderColor: dbColor, color: dbColor }}
              />
            </Box>

            {/* Language & Region */}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}
              >
                {t('footer:section.localization', 'Language & Region')}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {t('footer:locale.language', 'Language')}: {currentLanguage}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {t('footer:locale.region', 'Region')}: {region}
              </Typography>
            </Box>
          </Stack>

          <Divider sx={{ mb: 0.5 }} />

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 0.5, lineHeight: 1.4 }}
          >
            {t('footer:privacy.notice', 'This portfolio showcases a fictional enterprise inventory system. No real customer data is stored. For demonstration purposes only.')}
          </Typography>
        </Collapse>

        {/* COMPACT STATUS BAR (always visible, very small height) */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ minHeight: 40 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ maxWidth: { xs: '100%', sm: '60%' } }}
          >
            © 2025 Smart Supply Pro • v{appVersion} • Build {buildId} •{' '}
            {environment} • Demo data only
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            {renderHealthStatus(health)}
            <Divider orientation="vertical" flexItem />
            <Typography variant="caption" color="text.secondary">
              {currentLanguage}-{region}
            </Typography>
            <IconButton
              size="small"
              onClick={toggleDetails}
              aria-label="Footer details"
              sx={{ ml: 0.5 }}
            >
              <ExpandMoreIcon
                sx={{
                  fontSize: '1.1rem',
                  transform: detailsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
