/**
 * @file EditSupplierDialog.tsx
 * @module dialogs/EditSupplierDialog/EditSupplierDialog
 *
 * @summary
 * Dialog container for editing supplier contact information.
 * Orchestrates form logic hook and view components.
 *
 * @enterprise
 * - Separation of concerns: Dialog wrapper, form logic, view components
 * - Two-step workflow: search/select → edit info
 * - Manages dialog lifecycle (open/close/reset)
 * - Clean, readable component hierarchy
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  Divider,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast';
import { useHelp } from '../../../../hooks/useHelp';
import { useEditSupplierForm } from './useEditSupplierForm';
import { EditSupplierSearchStep } from './EditSupplierSearchStep';
import { EditSupplierInfoStep } from './EditSupplierInfoStep';
import { EditSupplierConfirmation } from './EditSupplierConfirmation';
import type { EditSupplierDialogProps } from './EditSupplierDialog.types';

/**
 * Dialog for editing supplier contact information.
 *
 * @remarks
 * Provides a guided two-step workflow:
 * 1. Search and select supplier
 * 2. Edit contact information
 *
 * Business rules:
 * - Only ADMIN role can edit suppliers
 * - Supplier name cannot be changed (immutable)
 * - Only contactName, phone, and email are editable
 *
 * @component
 * @param props - Dialog props
 * @returns JSX element with dialog and workflow
 *
 * @example
 * ```tsx
 * <EditSupplierDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSupplierUpdated={handleSupplierUpdated}
 * />
 * ```
 */
export const EditSupplierDialog: React.FC<EditSupplierDialogProps> = ({
  open,
  onClose,
  onSupplierUpdated,
}) => {
  const { t } = useTranslation(['common', 'suppliers']);
  const toast = useToast();
  const { openHelp } = useHelp();

  // Form logic hook
  const form = useEditSupplierForm(() => {
    toast(t('suppliers:status.updated', 'Supplier information updated successfully!'), 'success');
    onSupplierUpdated();
    handleClose();
  });

  /**
   * Reset form when dialog opens/closes.
   */
  React.useEffect(() => {
    if (!open) {
      form.resetForm();
    }
  }, [open, form]);

  /**
   * Handle dialog close.
   */
  const handleClose = React.useCallback(() => {
    form.resetForm();
    onClose();
  }, [form, onClose]);

  /**
   * Handle showing confirmation dialog.
   */
  const handleShowConfirmation = form.handleSubmit((values) => {
    if (!form.selectedSupplier) {
      form.setFormError(
        t('errors:supplier.selection.noSupplierSelected', 'Please select a supplier.')
      );
      return;
    }

    form.setFormError('');
    form.setPendingChanges(values);
    form.setShowConfirmation(true);
  });

  return (
    <>
      {/* Main Edit Dialog */}
      <Dialog open={open && !form.showConfirmation} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>{t('suppliers:dialogs.editSupplierTitle', 'Edit Supplier')}</Box>
            <Tooltip title={t('actions.help', 'Help')}>
              <IconButton size="small" onClick={() => openHelp('suppliers.manage')}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
            {/* Error Display */}
            {form.formError && (
              <Alert severity="error" onClose={() => form.setFormError('')}>
                {form.formError}
              </Alert>
            )}

            {/* Step 1: Search and Select Supplier */}
            <EditSupplierSearchStep
              searchQuery={form.searchQuery}
              onSearchQueryChange={form.handleSearchQueryChange}
              searchResults={form.searchResults}
              searchLoading={form.searchLoading}
              onSelectSupplier={form.handleSelectSupplier}
            />

            <Divider />

            {/* Step 2: Edit Supplier Info */}
            <EditSupplierInfoStep
              selectedSupplier={form.selectedSupplier}
              control={form.control}
              errors={form.formState.errors}
              isSubmitting={form.formState.isSubmitting}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={handleClose} disabled={form.formState.isSubmitting}>
            {t('common:actions.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleShowConfirmation}
            variant="contained"
            disabled={!form.selectedSupplier || form.formState.isSubmitting}
          >
            {t('suppliers:buttons.reviewChanges', 'Review Changes')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <EditSupplierConfirmation
        open={form.showConfirmation}
        supplier={form.selectedSupplier}
        changes={form.pendingChanges}
        formError={form.formError}
        isSubmitting={form.formState.isSubmitting}
        onConfirm={form.handleConfirmChanges}
        onCancel={() => form.setShowConfirmation(false)}
      />
    </>
  );
};

export default EditSupplierDialog;
