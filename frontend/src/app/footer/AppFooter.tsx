/**
 * @file AppFooter.tsx
 * @module app/footer/AppFooter
 *
 * @summary
 * Main application footer: a single static compact status bar.
 * Displays copyright/version metadata, documentation links, and system health.
 *
 * @enterprise
 * - Thin orchestrator: layout composition only; all state flows from useFooterState.
 * - The former collapsible details panel was removed: its content
 *   duplicated Settings > System Info and the hamburger Systeminfo section.
 *   Enterprise apps keep footers minimal; deep diagnostics live in settings.
 * - Legal pages (Impressum / Datenschutz) are part of the link row.
 */

import { Box, Container, Stack } from '@mui/material';
import { useFooterState } from './useFooterState';
import FooterLinks from './FooterLinks';
import HealthStatusDisplay from './HealthStatusDisplay';
import FooterMetaInfo from './FooterMetaInfo';

/**
 * Application footer component.
 *
 * Single always-visible compact bar: metadata (left), documentation links
 * (center), system health (right). No expandable state.
 *
 * @returns JSX element rendering the application footer
 */
export default function AppFooter() {
  const { health, config } = useFooterState();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderTopColor: 'divider',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 0.75 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          useFlexGap
          flexWrap="wrap"
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

          {/* Documentation Links */}
          <FooterLinks />

          {/* Health Status */}
          <HealthStatusDisplay health={health} />
        </Stack>
      </Container>
    </Box>
  );
}
