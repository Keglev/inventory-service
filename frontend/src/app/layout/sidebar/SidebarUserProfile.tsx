/**
 * @file SidebarUserProfile.tsx
 * @module app/layout/sidebar/SidebarUserProfile
 *
 * @summary
 * User profile information display component for sidebar footer.
 * Shows logged-in user's full name and role with i18n labels.
 *
 * @enterprise
 * - Clean display of user identity information
 * - Support for undefined/null user data with fallbacks
 * - i18n labels for internationalization
 * - Consistent typography and spacing
 * - Full TypeDoc coverage for user information display
 */

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface SidebarUserProfileProps {
  /** Current user information */
  user?: {
    fullName?: string;
    role?: string;
  };
}

/**
 * User profile information display component.
 *
 * Renders logged-in user's full name and role with fallback values.
 * Uses i18n for label translations.
 *
 * @param props - Component props
 * @returns JSX element rendering user profile section
 *
 * @example
 * ```tsx
 * <SidebarUserProfile user={{ fullName: 'John Doe', role: 'Admin' }} />
 * ```
 */
export default function SidebarUserProfile({ user }: SidebarUserProfileProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
        {t('common:loggedInAs', 'Logged in as:')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {user?.fullName || 'User'}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 0.5, mb: 0.5 }}>
        {t('common:role', 'Role:')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {user?.role || 'user'}
      </Typography>
    </Box>
  );
}
