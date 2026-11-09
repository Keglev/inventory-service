/**
 * @file DeleteSupplierDialog.tsx
 * @module pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierDialog
 *
 * @summary
 * Dialog container for deleting suppliers.
 *
 * @enterprise
 * - Separation of concerns: dialog wrapper, form logic (useDeleteSupplierForm),
 *   view components; this file owns the open/close/reset lifecycle
 * - Two-step workflow: search -> confirm deletion
 */

import * as React from 'react';
import { Dialog } from '@mui/material';
import { useDeleteSupplierForm } from './useDeleteSupplierForm';
import { DeleteSupplierSearch } from './DeleteSupplierSearch';
import { DeleteSupplierConfirmation } from './DeleteSupplierConfirmation';
import type { DeleteSupplierDialogProps } from './DeleteSupplierDialog.types';

/**
 * Dialog for deleting a supplier.
 *
 * @remarks
 * Two-step workflow:
 * 1. User searches for supplier to delete
 * 2. User confirms deletion with warning about irreversibility
 *
 * Business rules:
 * - Only ADMIN role can delete (enforced by backend)
 * - Cannot delete while any item references the supplier, deleted items included (409 Conflict)
 * - Backend returns 204 No Content on success
 *
 * @component
 * @param props - Dialog props
 * @returns JSX element with dialog and workflow
 *
 * @example
 * ```tsx
 * <DeleteSupplierDialog
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSupplierDeleted={handleSupplierDeleted}
 * />
 * ```
 */
export const DeleteSupplierDialog: React.FC<DeleteSupplierDialogProps> = ({
  open,
  onClose,
  onSupplierDeleted,
}) => {
  const form = useDeleteSupplierForm(() => {
    onSupplierDeleted();
    onClose();
  });

  /**
   * Prevent dialog close during deletion.
   */
  const handleDialogClose = React.useCallback(() => {
    if (!form.isDeleting) {
      form.resetForm();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `form` is a new object each render; its stable members are listed
  }, [form.isDeleting, form.resetForm, onClose]);

  /**
   * Handle cancel button (go back to search step).
   */
  const handleCancelConfirmation = React.useCallback(() => {
    form.setShowConfirmation(false);
    form.setSelectedSupplier(null);
    form.setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `form` is a new object each render; its stable members are listed
  }, [form.setShowConfirmation, form.setSelectedSupplier, form.setError]);

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 1,
          },
        },
      }}
    >
      {/* Search Step */}
      {!form.showConfirmation && (
        <DeleteSupplierSearch
          searchQuery={form.searchQuery}
          onSearchQueryChange={form.handleSearchQueryChange}
          searchResults={form.searchResults}
          searchLoading={form.searchLoading}
          onSelectSupplier={form.handleSelectSupplier}
          onCancel={handleDialogClose}
        />
      )}

      {/* Confirmation Step */}
      {form.showConfirmation && form.selectedSupplier && (
        <DeleteSupplierConfirmation
          supplier={form.selectedSupplier}
          error={form.error}
          isDeleting={form.isDeleting}
          onConfirm={form.handleConfirmDelete}
          onCancel={handleCancelConfirmation}
        />
      )}
    </Dialog>
  );
};
