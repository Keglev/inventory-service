/**
 * @file ProfileMenuSection.tsx
 * @module app/HamburgerMenu/ProfileMenuSection
 *
 * @summary
 * Section coordinator that composes the three ProfileSettings leaf components
 * (name, email, role) into the profile block of the hamburger menu.
 *
 * @enterprise
 * Sole consumer of useAuth for profile display; leaves are props-only so they
 * can be unit-tested without an auth context. Mounted exclusively by
 * MenuContent/MenuSectionsRenderer — no other consumer.
 */

import { Box, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import {
  ProfileNameDisplay,
  ProfileEmailDisplay,
  ProfileRoleDisplay,
} from './ProfileSettings';

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
        <ProfileNameDisplay fullName={user?.fullName} />
        <ProfileEmailDisplay email={user?.email} isDemo={isDemo} />
        <ProfileRoleDisplay role={user?.role} isDemo={isDemo} />
      </Stack>
    </Box>
  );
}
