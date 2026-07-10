/**
 * @file ProfileNameDisplay.tsx
 * @module app/HamburgerMenu/ProfileSettings/ProfileNameDisplay
 *
 * @summary
 * Read-only name row driven entirely by props; no hooks beyond useTranslation.
 *
 * @enterprise
 * - Props-only leaf: data flows from ProfileMenuSection (which reads useAuth);
 *   no state or data-fetching hooks in this component.
 *
 * @example
 * ```tsx
 * <ProfileNameDisplay fullName="John Doe" />
 * ```
 */

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ProfileNameDisplayProps {
  fullName?: string;
}

export default function ProfileNameDisplay({ fullName }: ProfileNameDisplayProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {t('common:name')}
      </Typography>
      <Typography variant="body2">
        {fullName || '—'}
      </Typography>
    </Box>
  );
}
