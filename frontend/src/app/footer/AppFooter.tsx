/**
 * @file AppFooter.tsx
 * @module app/footer/AppFooter
 *
 * @summary
 * Main application footer: one compact status bar with version, documentation links and
 * system health.
 *
 * @enterprise
 * - Thin orchestrator: layout composition only; all state flows from useFooterState.
 * - Kept minimal on purpose, as enterprise apps do; version and system details live
 *   in the About dialog.
 * - Legal pages (Impressum / Datenschutz) are part of the link row.
 */

import { Box, Container, Stack } from '@mui/material';
import { lightFooterSurface } from '../../theme/tokens';
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
        bgcolor: (theme) => (theme.palette.mode === 'light' ? lightFooterSurface : theme.palette.background.default),
      }}
    >
      <Container maxWidth="xl" sx={{ py: 0.75 }}>
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            minHeight: 40,
          }}
        >
          <FooterMetaInfo
            appVersion={config.appVersion}
            buildId={config.buildId}
          />

          <FooterLinks />

          <HealthStatusDisplay health={health} />
        </Stack>
      </Container>
    </Box>
  );
}
