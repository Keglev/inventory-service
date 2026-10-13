/**
 * @file SubmitDialogActions.tsx
 * @module pages/inventory/dialogs/SubmitDialogActions
 * @summary Cancel and submit buttons of an inventory form dialog, with a spinner
 *   over the submit button while the request runs.
 *
 * @enterprise
 * - ItemFormDialog and PriceChangeDialog carried the same 20 lines (jscpd, G-L7).
 *   Each dialog keeps what differs: its submit label, its extra disable rule and
 *   its test id; this component owns the layout and the busy state.
 * - Both buttons are disabled while submitting, so a second click cannot send the
 *   request twice and cancel cannot close the dialog under a running request.
 */
import type { ReactNode } from 'react';
import { Box, Button, CircularProgress, DialogActions } from '@mui/material';
import { useTranslation } from 'react-i18next';

/** Props accepted by {@link SubmitDialogActions}. */
export type SubmitDialogActionsProps = {
  /** Closes the dialog. */
  onCancel: () => void;
  /** Sends the form. */
  onSubmit: () => void;
  /** True while the request runs. */
  submitting: boolean;
  /** Content of the submit button. */
  submitLabel: ReactNode;
  /** Further reason to disable submit (e.g. nothing selected yet). */
  submitDisabled?: boolean;
  /** Test id of the submit button. */
  submitTestId?: string;
};

/**
 * Renders the dialog's action row.
 *
 * @param props - {@link SubmitDialogActionsProps}
 */
export function SubmitDialogActions({
  onCancel,
  onSubmit,
  submitting,
  submitLabel,
  submitDisabled = false,
  submitTestId,
}: SubmitDialogActionsProps) {
  const { t } = useTranslation(['common']);
  return (
    <DialogActions>
      <Button onClick={onCancel} disabled={submitting}>
        {t('common:actions.cancel')}
      </Button>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Button
          variant="contained"
          onClick={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          disabled={submitting || submitDisabled}
          data-testid={submitTestId}
        >
          {submitLabel}
        </Button>
        {submitting && (
          <CircularProgress
            size={24}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: '-12px',
              marginLeft: '-12px',
            }}
          />
        )}
      </Box>
    </DialogActions>
  );
}
