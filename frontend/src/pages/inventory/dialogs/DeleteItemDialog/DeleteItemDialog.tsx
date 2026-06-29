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
 *       the delete;
 *   (3) deletion reasons are restricted to a 6-value subset of the
 *       11-value StockChangeReason enum (SCRAPPED, DESTROYED, DAMAGED,
 *       EXPIRED, LOST, RETURNED_TO_SUPPLIER) -- ServiceImpl rejects
 *       reasons that do not describe a removal. The visible reason set
 *       in DeleteFormFields.tsx matches this enforcement exactly.
 *       CM-2 closure: subset is intentional and backend-authoritative.
 * - readOnly enables demo-mode preview: users walk through every form
 *   step, but the actual DELETE call is blocked at
 *   useDeleteItemHandlers.onConfirmedDelete.
 * - Help-icon wiring uses a raw IconButton + HelpOutlineIcon rather than
 *   the shared HelpIconButton component, and the tooltip key
 *   t('actions.help', 'Help') carries an English fallback. Tracked under
 *   CM-APP11 (component replacement) and CM-APP9 (fallback policy).
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  Box,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { useHelp } from '../../../../hooks/useHelp';
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
  const { openHelp } = useHelp();
  const state = useDeleteItemDialog(open, onClose, onItemDeleted, readOnly);

  return (
    <>
      {/* Form dialog: supplier -> item -> reason selection */}
      <Dialog open={open && !state.showConfirmation} onClose={state.handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>{t('inventory:dialogs.deleteItemTitle', 'Delete Item')}</Box>
            {/* BUCKET: CM-APP11 -- raw IconButton + HelpOutlineIcon. Replace with HelpIconButton (per CM-APP8 plan) and drop English fallback. */}
            <Tooltip title={t('actions.help', 'Help')}>
              <IconButton size="small" onClick={() => openHelp('inventory.deleteItem')}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <DeleteItemContent state={state} showConfirmation={false} />
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={state.handleClose} disabled={state.isSubmitting}>
            {t('inventory:buttons.cancel', 'Cancel')}
          </Button>
          {/* Delete button: disabled until item selected */}
          <Button
            onClick={state.onSubmit}
            variant="contained"
            color="error"
            disabled={!state.selectedItem || state.isSubmitting}
          >
            {state.isSubmitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                {t('common:deleting', 'Deleting...')}
              </>
            ) : (
              t('inventory:toolbar.delete', 'Delete')
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation dialog: warning + item details + final confirmation */}
      <Dialog open={state.showConfirmation} onClose={state.handleCancelConfirmation} maxWidth="sm" fullWidth>
        <DialogTitle>{t('inventory:dialogs.confirmDeleteTitle', 'Confirm Deletion')}</DialogTitle>
        <DialogContent dividers>
          <DeleteItemContent state={state} showConfirmation={true} />
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={state.handleCancelConfirmation} disabled={state.isSubmitting}>
            {t('inventory:buttons.no', 'No')}
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
                {t('common:deleting')}
              </>
            ) : (
              t('inventory:buttons.yes', 'Yes')
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteItemDialog;
