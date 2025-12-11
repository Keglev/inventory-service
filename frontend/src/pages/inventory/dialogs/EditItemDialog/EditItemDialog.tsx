/**
 * EditItemDialog - Main dialog container for item rename workflow
 * 
 * @module dialogs/EditItemDialog/EditItemDialog
 * @description
 * Enterprise dialog for editing inventory item names.
 * Orchestrates guided workflow: supplier → item → name change.
 * 
 * Delegates all business logic to useEditItemForm hook and renders
 * form via EditItemForm component. Manages only dialog lifecycle and layout.
 * 
 * @workflow
 * 1. User selects supplier from dropdown
 * 2. System enables item search for that supplier
 * 3. User searches and selects specific item
 * 4. System fetches and displays current item details
 * 5. User enters new item name and submits
 * 6. Backend updates name (ADMIN-only operation)
 * 
 * @validation
 * - Supplier must be selected before item search enabled
 * - Item must be selected before name change enabled
 * - New name must not be empty and differ from current name
 * - New name cannot be duplicate (checked by backend)
 * 
 * @authorization
 * PATCH /api/inventory/{id}/name?name={newName} - ADMIN only
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

/**
 * Props for EditItemDialog component
 * 
 * @interface EditItemDialogProps
 */
export interface EditItemDialogProps {
  /** Whether dialog is currently visible */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback after successful item rename (for parent refresh) */
  onItemRenamed: () => void;
}

/**
 * Enterprise dialog for renaming inventory items
 * 
 * Provides guided workflow with proper validation and UX optimizations.
 * Integrates with useEditItemForm for complete state and mutation management.
 * 
 * @component
 * @example
 * ```tsx
 * <EditItemDialog
 *   open={isDialogOpen}
 *   onClose={() => setIsDialogOpen(false)}
 *   onItemRenamed={() => {
 *     refreshInventoryList();
 *     showSuccessMessage();
 *   }}
 * />
 * ```
 * 
 * @enterprise
 * - Step-by-step validation prevents user errors
 * - Clear feedback on current item state
 * - Prevents duplicate names (backend enforced)
 * - ADMIN-only authorization with clear error messaging
 * - Internationalized for global deployment
 * - Consistent with DeleteItemDialog patterns
 */
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
