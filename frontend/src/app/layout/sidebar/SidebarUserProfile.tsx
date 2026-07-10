/**
 * @file SidebarUserProfile.tsx
 * @module app/layout/sidebar/SidebarUserProfile
 *
 * @summary
 * User profile information display component for sidebar footer.
 * Shows logged-in user's full name and role with i18n labels.
 *
 * @enterprise
 * - Accepts an optional user prop with graceful fallbacks ('User', 'user') so the sidebar renders correctly before auth data resolves.
 * - Receives user as a prop from AppShell (which owns auth state) rather than calling useAuth directly, keeping data flow explicit and testable.
 * - i18n keys are in the common namespace because these labels (Logged in as, Role) appear elsewhere in the app.
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
        {t('common:loggedInAs')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {user?.fullName || 'User'}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mt: 0.5, mb: 0.5 }}>
        {t('common:role')}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {user?.role || 'user'}
      </Typography>
    </Box>
  );
}
