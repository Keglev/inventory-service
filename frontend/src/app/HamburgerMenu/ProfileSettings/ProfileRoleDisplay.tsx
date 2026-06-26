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
 * - The capitalization expression `role.charAt(0).toUpperCase() + role.slice(1)`
 *   is a no-op for the actual inputs (backend sends "ADMIN"/"USER" via
 *   Role.name(); demo session uses "DEMO") — see CB-APP13.
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

  // BUCKET: dead capitalization — backend sends uppercase "ADMIN"/"USER" via Role.name(), demo uses "DEMO"; transformation is a no-op (CB-APP13)
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {t('common:role', 'Role')}
      </Typography>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography variant="body2">
          {displayRole}
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
  );
}
