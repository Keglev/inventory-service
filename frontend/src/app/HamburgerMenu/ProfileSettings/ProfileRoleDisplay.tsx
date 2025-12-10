/**
 * @file ProfileRoleDisplay.tsx
 * @module app/HamburgerMenu/ProfileSettings/ProfileRoleDisplay
 *
 * @summary
 * Displays user's role with optional demo badge.
 * Capitalizes role name and shows demo indicator if applicable.
 *
 * @example
 * ```tsx
 * <ProfileRoleDisplay role="admin" isDemo={true} />
 * ```
 */

import { Box, Stack, Typography, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ProfileRoleDisplayProps {
  /** User's role string */
  role?: string;

  /** Whether this is a demo account */
  isDemo: boolean;
}

/**
 * Profile role display component.
 *
 * Displays capitalized role with demo badge if user is on demo account.
 *
 * @param props - Component props
 * @returns JSX element displaying role and demo badge
 */
export default function ProfileRoleDisplay({ role, isDemo }: ProfileRoleDisplayProps) {
  const { t } = useTranslation(['common', 'auth']);

  // Capitalize role: convert "admin" to "Admin"
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
