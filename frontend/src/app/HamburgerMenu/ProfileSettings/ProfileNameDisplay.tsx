/**
 * @file ProfileNameDisplay.tsx
 * @module app/HamburgerMenu/ProfileSettings/ProfileNameDisplay
 *
 * @summary
 * Displays user's full name in the profile section.
 * Read-only display component with label.
 *
 * @example
 * ```tsx
 * <ProfileNameDisplay fullName="John Doe" />
 * ```
 */

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface ProfileNameDisplayProps {
  /** User's full name to display */
  fullName?: string;
}

/**
 * Profile name display component.
 *
 * @param props - Component props
 * @returns JSX element displaying user's name
 */
export default function ProfileNameDisplay({ fullName }: ProfileNameDisplayProps) {
  const { t } = useTranslation(['common']);

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {t('common:name', 'Name')}
      </Typography>
      <Typography variant="body2">
        {fullName || '—'}
      </Typography>
    </Box>
  );
}
