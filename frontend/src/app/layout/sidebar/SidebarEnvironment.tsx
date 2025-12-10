/**
 * @file SidebarEnvironment.tsx
 * @module app/layout/sidebar/SidebarEnvironment
 *
 * @summary
 * Environment and version metadata display component for sidebar footer.
 * Shows application environment and version information.
 *
 * @enterprise
 * - Hardcoded environment and version (configured via i18n keys)
 * - Clean metadata display with labels and values
 * - i18n support for future environment changes
 * - Consistent typography and spacing
 * - Full TypeDoc coverage for metadata display
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
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
        {t('footer:meta.environment', 'Environment:')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {t('app.environment', 'Production (Koyeb)')}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 0.5, mb: 0.5 }}>
        {t('footer:meta.version', 'Version:')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {t('app.version', '1.0.0')}
      </Typography>
    </Box>
  );
}
