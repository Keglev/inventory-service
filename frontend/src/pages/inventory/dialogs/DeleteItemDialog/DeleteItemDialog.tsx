/**
 * @file DeleteItemDialog.tsx
 * @module pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog
 *
 * @summary
 * Root component for the delete-item flow. Mounts two MUI Dialogs (form
 * and confirmation) driven by a single orchestrator hook, with help and
 * demo-mode wiring.
 *
 * @enterprise
 * - Two-dialog architecture, not one dialog with two states. The form
 *   Dialog and the confirmation Dialog are independent <Dialog> mounts
 *   keyed off showConfirmation. They share state through the
 *   useDeleteItemDialog hook. The benefit is mount-level isolation:
 *   transitions, focus traps, and unmount cleanup behave per dialog.
 * - Backend invariants surfaced to users:
 *   (1) only ADMIN users can delete items;
 *   (2) the item's on-hand quantity must be 0 before the backend accepts
 *       the delete. The Delete button is disabled and an inline hint is
 *       shown while the selected item still has stock (CB-APP71);
 *   (3) deletion takes no reason: it is a pure catalog removal, and the
 *       stock movement that emptied the item was already audited by the
 *       preceding quantity adjustment.
 * - readOnly enables demo-mode preview: users walk through every form
 *   step, but the actual DELETE call is blocked at
 *   useDeleteItemHandlers.onConfirmedDelete.
 * - Help opens the in-app drawer via the shared HelpIconButton component
 *   (CM-APP11 closure), though the tooltip key t('actions.help', 'Help')
 *   still carries an English fallback (CM-APP9).
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  CircularProgress,
} from '@mui/material';
import { HelpIconButton } from '../../../../features/help/components/HelpIconButton';
import { useTranslation } from 'react-i18next';
import { DeleteItemContent } from './DeleteItemContent';
import { useDeleteItemDialog } from './useDeleteItemDialog';

export interface DeleteItemDialogProps {
  open: boolean; // Dialog visibility state
  onClose: () => void; // Callback when dialog closes
  onItemDeleted: () => void; // Callback after successful deletion
  readOnly?: boolean; // Demo mode: allow UI navigation but block actual deletion
}

export const DeleteItemDialog: React.FC<DeleteItemDialogProps> = ({
  open,
  onClose,
  onItemDeleted,
  readOnly = false,
}) => {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const state = useDeleteItemDialog(open, onClose, onItemDeleted, readOnly);

  // Pre-gate: the backend only accepts deletion at quantity zero, so the
  // Delete button stays disabled while the selected item has stock on hand.
  const blockedByStock = (state.itemDetailsQuery.data?.onHand ?? 0) > 0;

  return (
    <>
      {/* Form dialog: supplier -> item -> reason selection */}
      <Dialog open={open && !state.showConfirmation} onClose={state.handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>{t('inventory:dialogs.deleteItemTitle')}</Box>
            <HelpIconButton topicId="inventory.deleteItem" tooltip={t('actions.help')} />
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <DeleteItemContent state={state} showConfirmation={false} />
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={state.handleClose} disabled={state.isSubmitting}>
            {t('inventory:buttons.cancel')}
          </Button>
          {/* Delete button: disabled until item selected and quantity is zero */}
          <Button
            onClick={state.onSubmit}
            variant="contained"
            color="error"
            disabled={!state.selectedItem || blockedByStock || state.isSubmitting}
          >
            {state.isSubmitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                {t('common:actions.deleting')}
              </>
            ) : (
              t('inventory:toolbar.delete')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation dialog: warning + item details + final confirmation */}
      <Dialog open={state.showConfirmation} onClose={state.handleCancelConfirmation} maxWidth="sm" fullWidth>
        <DialogTitle>{t('inventory:dialogs.confirmDeleteTitle')}</DialogTitle>
        <DialogContent dividers>
          <DeleteItemContent state={state} showConfirmation={true} />
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={state.handleCancelConfirmation} disabled={state.isSubmitting}>
            {t('inventory:buttons.no')}
          </Button>
          {/* Final confirmation: executes deletion after warning */}
          <Button
            onClick={state.onConfirmedDelete}
            variant="contained"
            color="error"
            disabled={state.isSubmitting}
          >
            {state.isSubmitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                {t('common:actions.deleting')}
              </>
            ) : (
              t('inventory:buttons.yes')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteItemDialog;
