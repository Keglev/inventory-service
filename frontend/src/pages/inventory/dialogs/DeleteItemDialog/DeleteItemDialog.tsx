/**
 * @file DeleteItemDialog.tsx
 * @module pages/inventory/dialogs/DeleteItemDialog
 *
 * @summary
 * Enterprise-level dialog for deleting inventory items.
 * Implements a guided 4-step workflow with validation and confirmation.
 *
 * @enterprise
 * - Strict validation: supplier must be selected before item search is enabled
 * - Safety mechanisms: confirmation dialog before deletion
 * - User experience: guided workflow prevents invalid operations
 * - Type safety: fully typed with Zod validation and TypeScript
 * - Accessibility: proper form labels, error states, and keyboard navigation
 * - Internationalization: complete i18n support for all user-facing text (DE/EN)
 * - Shared data hooks: uses centralized hooks for consistent caching and error handling
 * - Authorization: only ADMIN users can delete items
 *
 * @workflow
 * 1. User selects supplier from dropdown
 * 2. System enables item search for that supplier
 * 3. User searches and selects specific item to delete (2+ characters)
 * 4. User selects deletion reason from predefined list
 * 5. System displays confirmation dialog with item details
 * 6. User confirms deletion or cancels operation
 * 7. System validates item quantity = 0 before deletion
 * 8. Shows success or error message based on backend response
 *
 * @refactored
 * Split into:
 * - DeleteItemDialog.tsx - Main dialog container
 * - DeleteItemContent.tsx - Content layout (form + confirmation)
 * - useDeleteItemDialog.ts - State and logic hook
 *
 * @backend_api
 * DELETE /api/inventory/{id}?reason=MANUAL_UPDATE
 * - Only ADMIN role can use this endpoint
 * - Returns 204 No Content on success
 * - Returns 409 Conflict if item quantity > 0
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

/**
 * Props for the DeleteItemDialog component
 */
export interface DeleteItemDialogProps {
  /** Controls dialog visibility state */
  open: boolean;
  /** Callback invoked when dialog should be closed */
  onClose: () => void;
  /** Callback invoked after successful item deletion to refresh parent data */
  onItemDeleted: () => void;
  /** When true, dialog behaves as demo-readonly: user can navigate but actual delete is blocked */
  readOnly?: boolean;
}

/**
 * Enterprise-level delete item dialog component.
 *
 * Provides a guided 4-step workflow for deleting inventory items with
 * validation, confirmation, and error handling.
 *
 * @component
 * @example
 * ```tsx
 * <DeleteItemDialog
 *   open={isDialogOpen}
 *   onClose={() => setIsDialogOpen(false)}
 *   onItemDeleted={() => {
 *     refreshInventoryList();
 *     showSuccessMessage();
 *   }}
 * />
 * ```
 *
 * @enterprise
 * - Implements step-by-step validation to prevent accidental deletion
 * - Provides clear confirmation with item details
 * - Shows specific error messages for business rule violations
 * - Supports internationalization for global deployment
 * - Uses shared data hooks for consistent behavior across dialogs
 * - Only allows ADMIN users to delete items
 */
export const DeleteItemDialog: React.FC<DeleteItemDialogProps> = ({
  open,
  onClose,
  onItemDeleted,
  readOnly = false,
}) => {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const { openHelp } = useHelp();

  // Hook manages all state, validation, and deletion logic
  const state = useDeleteItemDialog(open, onClose, onItemDeleted, readOnly);

  return (
    <>
      {/* Main delete item dialog */}
      <Dialog
        open={open && !state.showConfirmation}
        onClose={state.handleClose}
        fullWidth
        maxWidth="sm"
      >
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

      {/* Confirmation dialog */}
      <Dialog
        open={state.showConfirmation}
        onClose={state.handleCancelConfirmation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('inventory:dialogs.confirmDeleteTitle', 'Confirm Deletion')}</DialogTitle>

        <DialogContent dividers>
          <DeleteItemContent state={state} showConfirmation={true} />
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={state.handleCancelConfirmation} disabled={state.isSubmitting}>
            {t('inventory:buttons.no', 'No')}
          </Button>
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
