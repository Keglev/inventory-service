/**
 * @file SidebarEnvironment.tsx
 * @module app/layout/sidebar/SidebarEnvironment
 *
 * @summary
 * Environment and version metadata display component for sidebar footer.
 * Shows application environment and version information.
 *
 * @enterprise
 * - Environment and version are served as i18n fallbacks rather than build-time env vars, allowing deployment-time string overrides without a rebuild.
 * - Reuses `footer:` namespace keys (footer:meta.environment, footer:meta.version) even though it renders in the sidebar, keeping terminology consistent with the footer component.
 */

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Environment and version metadata display component.
 *
 * Renders application environment (e.g., Production) and version.
 * Uses i18n for customizable display values.
 *
 * @returns JSX element rendering environment metadata section
 *
 * @example
 * ```tsx
 * <SidebarEnvironment />
 * // Displays: Environment: Production (Koyeb), Version: 1.0.0
 * ```
 */
export default function SidebarEnvironment() {
  const { t } = useTranslation(['common']);

  return (
    <Box>
      {/* footer: namespace keys are reused intentionally; terminology stays consistent with the footer component. */}
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
        {t('footer:meta.environment', 'Environment:')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {/* BUCKET: env/version hardcoded as i18n fallbacks — consolidate with footer config single source (CB-APP1) */}
        {t('app.environment', 'Production (Koyeb)')}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 0.5, mb: 0.5 }}>
        {t('footer:meta.version', 'Version:')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {/* BUCKET: env/version hardcoded as i18n fallbacks — consolidate with footer config single source (CB-APP1) */}
        {t('app.version', '1.0.0')}
      </Typography>
    </Box>
  );
}
