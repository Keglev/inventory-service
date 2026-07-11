/**
 * @file HeaderDemoBadge.tsx
 * @module app/layout/header/HeaderDemoBadge
 *
 * @summary
 * Demo mode badge component for header.
 * Displays prominent DEMO indicator when user is on demo account.
 *
 * @enterprise
 * - Pure conditional display: renders nothing when `isDemo` is false, keeping the header uncluttered for normal users.
 * - Chip is FILLED with the theme `warning` palette so the amber block reads
 *   clearly on both the light and dark header (the former outlined variant
 *   was near-invisible in dark mode); the label stays pinned '#000' for
 *   fixed contrast on the amber fill.
 * - The tooltip carries the former full-width demo banner text:
 *   the badge is now the single persistent demo indicator.
 * - i18n keys ('auth:demoBadge', 'auth:demoNotice') share the auth namespace with login/demo flows.
 */

import { Chip, Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface HeaderDemoBadgeProps {
  /** Whether user is on demo account */
  isDemo: boolean;
}

/**
 * Demo mode badge component.
 *
 * Displays prominent DEMO badge with an explanatory tooltip when the user is
 * on a demo account. Only renders if isDemo is true.
 *
 * @param props - Component props
 * @returns JSX element rendering demo badge, or null if not in demo mode
 */
export default function HeaderDemoBadge({ isDemo }: HeaderDemoBadgeProps) {
  const { t } = useTranslation(['auth']);

  if (!isDemo) {
    return null;
  }

  return (
    <Tooltip title={t('auth:demoNotice')}>
      <Chip
        size="small"
        label={t('auth:demoBadge')}
        color="warning"
        variant="filled"
        sx={{
          ml: 1,
          fontWeight: 700,
          '& .MuiChip-label': {
            fontWeight: 700,
            color: '#000',
          },
        }}
      />
    </Tooltip>
  );
}
