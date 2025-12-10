/**
 * DeleteItemDialog - Enterprise delete workflow dialog
 * 
 * Two-dialog flow:
 * 1. Form dialog: supplier → item search → reason selection
 * 2. Confirmation dialog: shows item details + deletion warning
 * 
 * Safety: Item quantity must be 0 before backend allows deletion
 * Auth: ADMIN role required
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
      {/* Form dialog: supplier → item → reason selection */}
      <Dialog open={open && !state.showConfirmation} onClose={state.handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>{t('inventory:dialogs.deleteItemTitle', 'Delete Item')}</Box>
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
