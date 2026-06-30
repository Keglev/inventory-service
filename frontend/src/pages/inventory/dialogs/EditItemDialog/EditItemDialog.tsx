/**
 * @file EditItemDialog.tsx
 * @module pages/inventory/dialogs/EditItemDialog/EditItemDialog
 *
 * @summary
 * Root dialog for the item-rename flow. Renders the title, the
 * EditItemForm body, and the cancel/change actions, and delegates all
 * state, queries, and submission to useEditItemForm.
 *
 * @enterprise
 * - Single-dialog architecture. Unlike DeleteItemDialog (two dialogs,
 *   form + confirmation), rename is a single modal because the change is
 *   reversible by another rename. No second confirmation step is offered.
 * - Backend invariants surfaced to users:
 *   (1) only ADMIN users can rename items (PATCH /api/inventory/{id}/name
 *       is admin-gated);
 *   (2) the new name must be unique within the same supplier; the
 *       backend rejects duplicates with a structured error;
 *   (3) the rename does not change inventory quantity or write a
 *       StockHistory row, so the schema carries no reason field.
 * - Help-icon wiring uses a raw IconButton + HelpOutlineIcon and a
 *   tooltip key with an English fallback. Same pattern as DeleteItemDialog
 *   tracked under CM-APP11; not duplicated here as a new bucket.
 * - Hook orchestration is in useEditItemForm; this file holds layout
 *   only, no business logic.
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Stack,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { useHelp } from '../../../../hooks/useHelp';
import { useEditItemForm } from './useEditItemForm';
import { EditItemForm } from './EditItemForm';

export interface EditItemDialogProps {
  /** Whether dialog is currently visible */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback after successful item rename (for parent refresh) */
  onItemRenamed: () => void;
}

export const EditItemDialog: React.FC<EditItemDialogProps> = ({
  open,
  onClose,
  onItemRenamed,
}) => {
  const { t } = useTranslation(['common', 'inventory']);
  const { openHelp } = useHelp();

  // Orchestrate all form state, queries, and handlers
  const form = useEditItemForm(open, onClose, onItemRenamed);

  return (
    <Dialog open={open} onClose={form.handleClose} fullWidth maxWidth="sm">
      {/* Dialog title with help button */}
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>{t('inventory:dialogs.editItemTitle', 'Edit Item')}</Box>
          <Tooltip title={t('actions.help', 'Help')}>
            <IconButton size="small" onClick={() => openHelp('inventory.editItem')}>
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      {/* Form with three-step workflow */}
      <DialogContent dividers>
        <EditItemForm state={form} />
      </DialogContent>

      {/* Action buttons: Cancel and Change */}
      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={form.handleClose} disabled={form.formState.isSubmitting}>
          {t('inventory:buttons.cancel', 'Cancel')}
        </Button>
        <Button
          onClick={form.onSubmit}
          variant="contained"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              {t('common:saving', 'Saving...')}
            </>
          ) : (
            t('inventory:buttons.change', 'Change')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditItemDialog;
