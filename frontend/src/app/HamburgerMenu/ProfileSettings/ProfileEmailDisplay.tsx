/**
 * @file ProfileEmailDisplay.tsx
 * @module app/HamburgerMenu/ProfileSettings/ProfileEmailDisplay
 *
 * @summary
 * Displays user's email or demo account message.
 * Handles both regular and demo user scenarios.
 *
 * @example
 * ```tsx
 * <ProfileEmailDisplay email="user@example.com" isDemo={false} />
 * ```
 */

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ProfileEmailDisplayProps {
  /** User's email address */
  email?: string;

  /** Whether this is a demo account */
  isDemo: boolean;
}

/**
 * Profile email display component.
 *
 * Shows either user's email or demo account message depending on account type.
 *
 * @param props - Component props
 * @returns JSX element displaying email or demo message
 */
export default function ProfileEmailDisplay({ email, isDemo }: ProfileEmailDisplayProps) {
  const { t } = useTranslation(['common', 'auth']);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {t('common:email', 'Email')}
      </Typography>
      <Typography variant="body2">
        {isDemo
          ? t('auth:demo.noEmailProvided', 'Demo Account, No email provided')
          : email || '—'}
      </Typography>
    </Box>
  );
}
