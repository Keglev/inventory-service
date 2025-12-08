/**
 * @file ProfileMenuSection.tsx
 * @module app/HamburgerMenu/ProfileMenuSection
 *
 * @summary
 * Displays user profile information in the hamburger menu.
 * - Name, email (or "demo Account, No email provided" for demo), role
 * - Read-only section (no editing in this UI)
 */

import { Box, Typography, Stack, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileMenuSection() {
  const { t } = useTranslation(['common', 'auth']);
  const { user } = useAuth();
  const isDemo = Boolean(user?.isDemo);

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {t('auth:profile.title', 'Mein Profil / My Profile')}
      </Typography>

      <Stack spacing={0.75}>
        {/* Name */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('common:name', 'Name')}
          </Typography>
          <Typography variant="body2">
            {user?.fullName || '—'}
          </Typography>
        </Box>

        {/* Email or Demo Message */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('common:email', 'Email')}
          </Typography>
          <Typography variant="body2">
            {isDemo
              ? t('auth:demo.noEmailProvided', 'Demo Account, No email provided')
              : user?.email || '—'}
          </Typography>
        </Box>

        {/* Role with Demo Badge if applicable */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t('common:role', 'Role')}
          </Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </Typography>
            {isDemo && (
              <Chip
                size="small"
                label={t('auth:demoBadge', 'DEMO')}
                color="warning"
                variant="outlined"
                sx={{ height: 20 }}
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
