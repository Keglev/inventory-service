/**
 * @file AppFooter.tsx
 * @module app/footer/AppFooter
 *
 * @summary
 * Main application footer component (replaces Footer.tsx).
 * Thin orchestrator managing footer layout and section composition.
 * Displays legal info, support links, system health, and localization.
 *
 * @enterprise
 * - Collapsible details panel (click expand button)
 * - Compact status bar always visible
 * - Real-time system health monitoring
 * - i18n support for all text
 * - Responsive layout for mobile and desktop
 * - Full TypeDoc coverage for footer orchestration
 */

import {
  Box,
  Container,
  Typography,
  Divider,
  Stack,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from 'react-i18next';
import { useFooterState } from './useFooterState';
import FooterLegal from './FooterLegal';
import FooterLinks from './FooterLinks';
import HealthStatusDisplay from './HealthStatusDisplay';
import LocalizationDisplay from './LocalizationDisplay';
import FooterMetaInfo from './FooterMetaInfo';

/**
 * Application footer component.
 *
 * Thin orchestrator that delegates to focused sub-components.
 * Manages collapsible details panel and compact status bar layout.
 *
 * Features:
 * - Collapsible details section with legal, links, health, and localization
 * - Compact always-visible status bar
 * - Real-time system health monitoring
 * - i18n support for all labels and text
 * - Responsive design for mobile and desktop
 *
 * @returns JSX element rendering the application footer
 *
 * @example
 * ```tsx
 * <AppFooter />
 * ```
 */
export default function AppFooter() {
  const { t } = useTranslation(['common', 'footer']);
  const { detailsOpen, toggleDetails, health, config } = useFooterState();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: '1px solid',
        borderTopColor: 'divider',
        bgcolor: 'background.default',
        zIndex: (theme) => theme.zIndex.appBar - 1,
      }}
    >
      <Container maxWidth="xl" sx={{ py: 0.5 }}>
        {/* Collapsible Details Panel */}
        <Collapse in={detailsOpen} unmountOnExit>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 0.75 }}
          >
            {/* Legal & Meta Information */}
            <FooterLegal
              appVersion={config.appVersion}
              buildId={config.buildId}
              environment={config.environment}
            />

            {/* Support & Documentation Links */}
            <FooterLinks />

            {/* System Health Status */}
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}
              >
                {t('footer:section.health', 'System Health')}
              </Typography>
              <HealthStatusDisplay health={health} />
            </Box>

            {/* Language & Region */}
            <LocalizationDisplay
              currentLanguage={config.currentLanguage}
              region={config.region}
            />
          </Stack>

          <Divider sx={{ mb: 0.5 }} />

          {/* Privacy Notice */}
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 0.5, lineHeight: 1.4 }}
          >
            {t('footer:privacy.notice', 'This portfolio showcases a fictional enterprise inventory system. No real customer data is stored. For demonstration purposes only.')}
          </Typography>
        </Collapse>

        {/* Compact Status Bar (always visible) */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ minHeight: 40 }}
        >
          {/* Meta Information */}
          <FooterMetaInfo
            appVersion={config.appVersion}
            buildId={config.buildId}
            environment={config.environment}
            currentLanguage={config.currentLanguage}
            region={config.region}
          />

          {/* Health Status and Expand Button */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            <HealthStatusDisplay health={health} />
            <Divider orientation="vertical" flexItem />
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
}
