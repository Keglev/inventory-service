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
import { Box, Container, Typography, Link, Divider, Stack, Chip, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import { useHealthCheck } from '../features/health/hooks/useHealthCheck';

const Footer: React.FC = () => {
  const { i18n } = useTranslation(['common']);
  const { health } = useHealthCheck();
  
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    legal: false,
    support: false,
    health: false,
    language: false,
  });

  const currentLanguage = i18n.language.split('-')[0].toUpperCase();
  const region = 'DE';
  const buildId = '4a9c12f';
  const environment = 'Production (Koyeb)';
  const appVersion = '1.0.0';

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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

  /**
   * Collapsible section header with toggle icon
   */
  const CollapsibleHeader: React.FC<{ title: string; sectionKey: string }> = ({ title, sectionKey }) => (
    <Box
      onClick={() => toggleSection(sectionKey)}
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        py: 1,
        px: 1,
        borderRadius: 0.5,
        transition: 'background-color 0.2s',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <ExpandMoreIcon
        sx={{
          transform: expandedSections[sectionKey] ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s',
          fontSize: '1.2rem',
        }}
      />
    </Box>
  );

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        pt: 2,
        pb: 2,
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderTopColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={1}>
          {/* Section 1: Legal & Meta */}
          <CollapsibleHeader title="Legal & Meta" sectionKey="legal" />
          <Collapse in={expandedSections.legal}>
            <Stack spacing={0.5} sx={{ pl: 2, pb: 1.5 }}>
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
          </Collapse>

          {/* Section 2: Support & Documentation */}
          <CollapsibleHeader title="Support & Docs" sectionKey="support" />
          <Collapse in={expandedSections.support}>
            <Stack spacing={0.5} sx={{ pl: 2, pb: 1.5 }}>
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
          </Collapse>

          {/* Section 3: System Health */}
          <CollapsibleHeader title="System Health" sectionKey="health" />
          <Collapse in={expandedSections.health}>
            <Stack spacing={1} sx={{ pl: 2, pb: 1.5 }}>
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
          </Collapse>

          {/* Section 4: Language & Region */}
          <CollapsibleHeader title="Language & Region" sectionKey="language" />
          <Collapse in={expandedSections.language}>
            <Stack spacing={0.5} sx={{ pl: 2, pb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Language: {currentLanguage}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Region: {region}
              </Typography>
            </Stack>
          </Collapse>

          <Divider sx={{ my: 1 }} />

          {/* Data Privacy Blurb */}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.6, py: 1 }}>
            This portfolio showcases a fictional enterprise inventory system. No real customer data is stored. For demonstration purposes only.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;
