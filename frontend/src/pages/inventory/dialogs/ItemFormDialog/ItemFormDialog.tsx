/**
 * @file ItemFormDialog.tsx
 * @module pages/inventory/dialogs/ItemFormDialog/ItemFormDialog
 *
 * @summary
 * Root dialog for create-or-edit item. Title, body (ItemForm), and
 * actions change based on whether `initial?.id` is set. Delegates all
 * state and submission to useItemForm.
 *
 * @enterprise
 * - One dialog, two modes. Create vs edit is decided by initial?.id;
 *   the dialog title, submit label, and the visibility of the reason
 *   field all key off this single check. Splitting into two components
 *   would duplicate the form-field layout and the supplier alignment
 *   effect.
 * - Help-icon wiring is inconsistent with the sibling dialogs.
 *   EditItemDialog and DeleteItemDialog use useHelp() to open the help
 *   drawer; this file uses window.open('#/help?section=...') instead,
 *   which bypasses the in-app help panel entirely. Tracked under
 *   CB-APP54 -- switch to useHelp for consistency, and the tooltip
 *   key t('common:help', 'Help') still carries an English fallback
 *   (CM-APP9 / CM-APP11 territory).
 * - Submit fires via state.handleSubmit(state.onSubmit)(e) rather than
 *   state.onSubmit directly because onSubmit is already wrapped by
 *   react-hook-form internally; the chained call here is redundant
 *   but harmless. Documented for the refactor decision.
 */

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { ItemForm } from './ItemForm';
import { useItemForm } from './useItemForm';
import type { ItemFormDialogProps } from './ItemFormDialog.types';

/**
 * ItemFormDialog - Main dialog component
 * 
 * Opens when isOpen is true. Renders ItemForm and manages dialog actions.
 * All form state/queries/validation delegated to useItemForm hook.
 * 
 * @param isOpen - Whether dialog is visible
 * @param onClose - Called on cancel or successful save
 * @param initial - Initial item data (undefined for create mode)
 */
export function ItemFormDialog({
  isOpen,
  onClose,
  initial,
  onSaved,
}: ItemFormDialogProps) {
  const { t } = useTranslation(['common', 'inventory']);

  // All form state and handlers delegated to hook
  const state = useItemForm({ isOpen, onClose, initial, onSaved });

  // Dialog title reflects create vs edit mode
  const dialogTitle = initial?.id
    ? t('inventory:dialogs.editItem', 'Edit Item')
    : t('inventory:dialogs.createItem', 'Create Item');

  // Button label also changes based on mode
  const submitLabel = initial?.id
    ? t('common:actions.save', 'Save')
    : t('common:actions.create', 'Create');

  return (
    <Dialog
      open={isOpen}
      onClose={() => state.handleClose()}
      maxWidth="sm"
      fullWidth
    >
      {/* Title with help icon */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{dialogTitle}</span>
        {/* BUCKET: CB-APP54 -- raw window.open bypasses the in-app help panel. Switch to useHelp() to match EditItemDialog and DeleteItemDialog. */}
        <Tooltip title={t('common:help', 'Help')}>
          <IconButton
            size="small"
            onClick={() => {
              const section = initial?.id ? 'edit_item' : 'create_item';
              window.open(`#/help?section=${section}`, '_blank');
            }}
            aria-label="help"
          >
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      {/* Form content */}
      <DialogContent>
        <ItemForm state={state} initial={initial} />
      </DialogContent>

      {/* Dialog actions */}
      <DialogActions>
        <Button onClick={() => state.handleClose()} disabled={state.formState.isSubmitting}>
          {t('common:actions.cancel', 'Cancel')}
        </Button>
        <Box sx={{ position: 'relative', display: 'inline-block' }}>
          <Button
            variant="contained"
            onClick={(e) => {
              e.preventDefault();
              state.handleSubmit(state.onSubmit)(e);
            }}
            disabled={state.formState.isSubmitting}
          >
            {submitLabel}
          </Button>
          {state.formState.isSubmitting && (
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
    </Dialog>
  );
}
