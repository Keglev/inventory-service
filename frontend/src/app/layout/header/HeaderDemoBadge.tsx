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
 * - Chip outline uses the theme `warning` palette (mode-aware), but the label color is
 *   pinned to '#000' for fixed contrast against the outlined chip — a deliberate
 *   override, not a theme-inherited value (black-on-warning can read poorly in dark mode).
 * - The tooltip carries the former full-width demo banner text (CB-APP77):
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
    <Tooltip title={t('auth:demoNotice', 'You are browsing in demo mode. Changes are disabled.')}>
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
    </Tooltip>
  );
}
