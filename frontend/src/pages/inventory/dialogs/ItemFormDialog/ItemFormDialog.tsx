/**
 * @file ItemFormDialog.tsx
 * @module pages/inventory/dialogs/ItemFormDialog/ItemFormDialog
 *
 * @summary
 * Root dialog for creating an item. Renders ItemForm and the dialog
 * actions; delegates all state and submission to useItemForm.
 *
 * @enterprise
 * - Create only. An existing item is changed through the dedicated
 *   dialogs (EditItemDialog for the name, PriceChangeDialog,
 *   QuantityAdjustDialog), each with its own reason flow, so this
 *   dialog carries no edit branch.
 * - Help opens the in-app drawer via the shared HelpIconButton component,
 *   matching the sibling dialogs. The tooltip key
 *   resolves to the shared common:actions.help leaf.
 * - Submit calls state.onSubmit, which useItemForm already wrapped with
 *   react-hook-form's handleSubmit, so validation runs once. The four
 *   sibling dialogs wire their primary action the same way.
 * - readOnly (demo mode) goes straight to useItemForm, whose guard stops
 *   a valid submit before the request (frontend ADR-0013).
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
 * @param readOnly - Demo mode: blocks submission, not the form
 */
export function ItemFormDialog({
  isOpen,
  onClose,
  onSaved,
  readOnly,
}: ItemFormDialogProps) {
  const { t } = useTranslation(['common', 'inventory']);

  // All form state and handlers delegated to hook
  const state = useItemForm({ isOpen, onClose, onSaved, readOnly });

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
        <span>{t('inventory:dialogs.createItemTitle')}</span>
        <HelpIconButton
          topicId="inventory.manage"
          tooltip={t('common:actions.help')}
        />
      </DialogTitle>

      {/* Form content */}
      <DialogContent>
        <ItemForm state={state} />
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
              void state.onSubmit();
            }}
            disabled={state.formState.isSubmitting}
          >
            {t('common:actions.create')}
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
