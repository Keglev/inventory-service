/**
 * @file NotificationsSettingsSection.tsx
 * @module app/settings/sections/NotificationsSettingsSection
 *
 * @summary
 * Notifications settings section component (placeholder).
 * Reserved for future notification preferences configuration.
 *
 * @enterprise
 * - Live placeholder: section is visible in the dialog but has no functional controls yet (see CB-APP9)
 */

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Notifications settings section component.
 *
 * Placeholder component for future notification settings implementation.
 * Maintains consistent section structure with other settings sections.
 *
 * @returns JSX element rendering placeholder notification settings
 *
 * @example
 * ```tsx
 * <NotificationsSettingsSection />
 * ```
 */
export default function NotificationsSettingsSection() {
  const { t } = useTranslation(['common']);

  return (
    <Box>
      {/* BUCKET: live empty placeholder section — implement, hide, or remove until real (CB-APP9) */}
      <Typography variant="body2" color="text.secondary">
        {t('settings.notificationsConfigured', 'Notification settings will be configured here')}
      </Typography>
    </Box>
  );
}
