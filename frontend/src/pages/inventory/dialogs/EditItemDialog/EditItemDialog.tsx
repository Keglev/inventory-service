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
 * - Help opens the in-app drawer via the shared HelpIconButton component,
 *   matching DeleteItemDialog's CM-APP11 closure. The tooltip key still
 *   carries an English fallback.
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
  Stack,
  CircularProgress,
} from '@mui/material';
import { HelpIconButton } from '../../../../features/help';
import { useTranslation } from 'react-i18next';
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

  // Orchestrate all form state, queries, and handlers
  const form = useEditItemForm(open, onClose, onItemRenamed);

  return (
    <Dialog open={open} onClose={form.handleClose} fullWidth maxWidth="sm">
      {/* Dialog title with help button */}
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>{t('inventory:dialogs.editItemTitle', 'Edit Item')}</Box>
          <HelpIconButton topicId="inventory.editItem" tooltip={t('common:actions.help', 'Help')} />
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
