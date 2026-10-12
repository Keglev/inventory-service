/**
 * @file ProfileEmailDisplay.tsx
 * @module app/HamburgerMenu/ProfileSettings/ProfileEmailDisplay
 *
 * @summary
 * Read-only email row; branches on `isDemo` to show a demo-mode placeholder
 * instead of the real email address.
 *
 * @enterprise
 * - The `isDemo` branch is the only non-trivial logic: demo accounts have no
 *   real email, so the branch prevents a blank field and shows a user-friendly
 *   message instead.
 * - Props-only leaf: data flows from ProfileMenuSection (which reads useAuth);
 *   no state or data-fetching hooks in this component.
 *
 * @example
 * ```tsx
 * <ProfileEmailDisplay email="user@example.com" isDemo={false} />
 * ```
 */

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ProfileEmailDisplayProps {
  email?: string;
  isDemo: boolean;
}

export default function ProfileEmailDisplay({ email, isDemo }: ProfileEmailDisplayProps) {
  const { t } = useTranslation(['common', 'auth']);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {t('common:email')}
      </Typography>
      <Typography variant="body2">
        {isDemo
          ? t('auth:demo.noEmailProvided')
          : email || '—'}
      </Typography>
    </Box>
  );
}
