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
 * - Help opens the in-app drawer via the shared HelpIconButton component,
 *   matching the sibling dialogs. The tooltip key
 *   resolves to the shared common:actions.help leaf.
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
} from '@mui/material';
import { HelpIconButton } from '../../../../features/help/components/HelpIconButton';
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
    ? t('inventory:dialogs.editItemTitle')
    : t('inventory:dialogs.createItemTitle');

  // Button label also changes based on mode
  const submitLabel = initial?.id
    ? t('common:actions.save')
    : t('common:actions.create');

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
        <HelpIconButton
          topicId={initial?.id ? 'inventory.editItem' : 'inventory.manage'}
          tooltip={t('common:actions.help')}
        />
      </DialogTitle>

      {/* Form content */}
      <DialogContent>
        <ItemForm state={state} initial={initial} />
      </DialogContent>

      {/* Dialog actions */}
      <DialogActions>
        <Button onClick={() => state.handleClose()} disabled={state.formState.isSubmitting}>
          {t('common:actions.cancel')}
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
