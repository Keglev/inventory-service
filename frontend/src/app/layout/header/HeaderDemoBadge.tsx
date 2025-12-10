/**
 * @file HeaderDemoBadge.tsx
 * @module app/layout/header/HeaderDemoBadge
 *
 * @summary
 * Demo mode badge component for header.
 * Displays prominent DEMO indicator when user is on demo account.
 *
 * @enterprise
 * - Clear visual indication of demo mode
 * - Only shown when isDemo is true
 * - Yellow/warning color for visibility
 * - Full TypeDoc coverage for demo mode display
 */

import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface HeaderDemoBadgeProps {
  /** Whether user is on demo account */
  isDemo: boolean;
}

/**
 * Demo mode badge component.
 *
 * Displays prominent DEMO badge when user is on demo account.
 * Only renders if isDemo is true.
 *
 * @param props - Component props
 * @returns JSX element rendering demo badge, or null if not in demo mode
 *
 * @example
 * ```tsx
 * <HeaderDemoBadge isDemo={true} />
 * // Shows: Yellow "DEMO" badge
 *
 * <HeaderDemoBadge isDemo={false} />
 * // Shows: null (nothing rendered)
 * ```
 */
export default function HeaderDemoBadge({ isDemo }: HeaderDemoBadgeProps) {
  const { t } = useTranslation(['auth']);

  if (!isDemo) {
    return null;
  }

  return (
    <Chip
      size="small"
      label={t('auth:demoBadge', 'DEMO')}
      color="warning"
      variant="outlined"
      sx={{
        ml: 1,
        fontWeight: 700,
        '& .MuiChip-label': {
          fontWeight: 700,
          color: '#000',
        },
      }}
    />
  );
}
