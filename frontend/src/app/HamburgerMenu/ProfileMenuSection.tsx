/**
 * @file ProfileMenuSection.tsx
 * @module app/HamburgerMenu/ProfileMenuSection
 *
 * @summary
 * Profile menu section coordinator that composes user profile display components.
 * Acts as a thin container orchestrating sub-components from ProfileSettings subdirectory.
 * Displays name, email (or demo message), and role with demo badge if applicable.
 *
 * @enterprise
 * - Delegates individual profile fields to focused sub-components
 * - Integrates with useAuth hook for user data
 * - Maintains clean separation of concerns
 * - Read-only display section (no editing in this UI)
 */

import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import {
  ProfileNameDisplay,
  ProfileEmailDisplay,
  ProfileRoleDisplay,
} from './ProfileSettings';

/**
 * Profile menu section component.
 *
 * Coordinates three distinct profile display components:
 * 1. User's full name
 * 2. Email or demo account message
 * 3. Role with optional demo badge
 *
 * @returns JSX element rendering the profile information section
 */
export default function ProfileMenuSection() {
  const { t } = useTranslation(['auth']);
  const { user } = useAuth();
  const isDemo = Boolean(user?.isDemo);

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {t('profile.title', 'Mein Profil / My Profile')}
      </Typography>

      <Stack spacing={0.75}>
        {/* Name Display Component */}
        <ProfileNameDisplay fullName={user?.fullName} />

        {/* Email or Demo Message Component */}
        <ProfileEmailDisplay email={user?.email} isDemo={isDemo} />

        {/* Role with Demo Badge Component */}
        <ProfileRoleDisplay role={user?.role} isDemo={isDemo} />
      </Stack>
    </Box>
  );
}
