/**
 * @file ProfileRoleDisplay.tsx
 * @module app/HamburgerMenu/ProfileSettings/ProfileRoleDisplay
 *
 * @summary
 * Read-only role row; renders the role string and a demo Chip when `isDemo` is true.
 *
 * @enterprise
 * - Props-only leaf: data flows from ProfileMenuSection (which reads useAuth);
 *   no state or data-fetching hooks in this component.
 * - Maps the backend's uppercase role token (Role.name(): "ADMIN"/"USER"/"DEMO")
 *   to a localized label via common:roles.*, falling back to the raw token.
 *
 * @example
 * ```tsx
 * <ProfileRoleDisplay role="ADMIN" isDemo={true} />
 * ```
 */

import { Box, Stack, Typography, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ProfileRoleDisplayProps {
  role?: string;
  isDemo: boolean;
}

export default function ProfileRoleDisplay({ role, isDemo }: ProfileRoleDisplayProps) {
  const { t } = useTranslation(['common', 'auth']);

  // WHY: backend sends Role.name() uppercase tokens (ADMIN/USER/DEMO); map to localized labels, falling back to the raw token for unknown roles.
  const roleKey = (role || 'USER').toLowerCase();
  const displayRole = t(`common:roles.${roleKey}`, role || 'User');

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {t('common:role')}
      </Typography>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography variant="body2">
          {displayRole}
        </Typography>
        {isDemo && (
          <Chip
            size="small"
            label={t('auth:demoBadge')}
            color="warning"
            variant="outlined"
            sx={{ height: 20 }}
          />
        )}
      </Stack>
    </Box>
  );
}
