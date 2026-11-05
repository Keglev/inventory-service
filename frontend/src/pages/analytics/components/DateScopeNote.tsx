/**
 * @file DateScopeNote.tsx
 * @module pages/analytics/components/DateScopeNote
 *
 * @summary
 * One caption line under a card title stating that the card ignores the date
 * filter: a current snapshot or an all-time count.
 *
 * @enterprise
 * The low-stock list, the supplier value pie and the update-frequency chart sit
 * under the Analytik date filter but do not depend on it. Without a note the page
 * would claim a date-limited view it does not show; the cards neither send dates
 * nor refetch on a date change.
 */
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export type DateScopeNoteProps = {
  /** "current": a snapshot of today; "allTime": counted over all recorded history. */
  kind: 'current' | 'allTime';
};

export default function DateScopeNote({ kind }: DateScopeNoteProps) {
  const { t } = useTranslation(['analytics']);
  return (
    <Typography
      variant="caption"
      component="p"
      data-testid="date-scope-note"
      sx={{
        color: 'text.secondary',
        mt: -0.5,
        mb: 1,
      }}
    >
      {t(kind === 'current' ? 'analytics:scope.current' : 'analytics:scope.allTime')}
    </Typography>
  );
}
