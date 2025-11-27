/**
 * @file DeleteItemDialog.tsx
 * @module pages/inventory/DeleteItemDialog
 *
 * @summary
 * Enterprise-level dialog for deleting inventory items.
 * Implements a guided workflow with confirmation: supplier selection → item selection → confirmation.
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
 * 1. User selects supplier from dropdown (via useSuppliersQuery)
 * 2. System enables item search for that supplier (via useItemSearchQuery with client-side filtering)
 * 3. User searches and selects specific item to delete (type-ahead with 2+ characters)
 * 4. System displays confirmation dialog: "Are you sure you want to delete this item?"
 * 5. User confirms deletion or cancels operation
 * 6. System validates item quantity = 0 before deletion
 * 7. Shows success or error message based on backend response
 *
 * @validation
 * - Supplier must be selected before item search is enabled
 * - Item must be selected before deletion is enabled
 * - Backend validates quantity = 0 before allowing deletion
 * - Error if: "You still have merchandise in stock"
 *
 * @backend_api
 * DELETE /api/inventory/{id}?reason=MANUAL_UPDATE
 * - Only ADMIN role can use this endpoint
 * - Returns 204 No Content on success
 * - Returns 409 Conflict if item quantity > 0
 * - Returns 404 Not Found if item doesn't exist
 * 
 * @refactored
 * Uses shared hooks and types from:
 * - `hooks/useInventoryData.ts` - Data fetching hooks
 * - `types/inventory-dialog.types.ts` - TypeScript interfaces
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  Autocomplete,
  TextField,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../app/ToastContext';
import { useHelp } from '../../hooks/useHelp';
import { deleteItem } from '../../api/inventory/mutations';
import { deleteItemSchema } from './validation';
import type { DeleteItemForm } from './validation';
import type { SupplierOption, ItemOption } from './types/inventory-dialog.types';
import { useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery } from './hooks/useInventoryData';

/**
 * Properties for the DeleteItemDialog component.
 * 
 * @interface DeleteItemDialogProps
 * @property {boolean} open - Controls dialog visibility
 * @property {() => void} onClose - Callback when dialog is closed
 * @property {() => void} onItemDeleted - Callback when item is successfully deleted
 */
export interface DeleteItemDialogProps {
  /** Controls dialog visibility state */
  open: boolean;
  /** Callback invoked when dialog should be closed */
  onClose: () => void;
  /** Callback invoked after successful item deletion to refresh parent data */
  onItemDeleted: () => void;
}

/**
 * Enterprise-level delete item dialog component.
 * 
 * Provides a guided workflow for deleting inventory items with confirmation
 * and proper validation.
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
 * 
 * @refactored
 * - Data fetching centralized via hooks/useInventoryData.ts
 * - Type definitions shared via types/inventory-dialog.types.ts
 * - Eliminates code duplication with EditItemDialog
 */
export const DeleteItemDialog: React.FC<DeleteItemDialogProps> = ({
  open,
  onClose,
  onItemDeleted,
}) => {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();
  const { openHelp } = useHelp();

  // ================================
  // State Management
  // ================================
  
  /** Currently selected supplier for item filtering */
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  
  /** Currently selected item for deletion */
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null);
  
  /** Search query for item autocomplete filtering (minimum 2 characters) */
  const [itemQuery, setItemQuery] = React.useState('');
  
  /** Form error message for user feedback */
  const [formError, setFormError] = React.useState<string>('');

  /** Whether confirmation dialog is shown */
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  /** Selected deletion reason from dropdown */
  const [deletionReason, setDeletionReason] = React.useState<string>('');

  // ================================
  // Data Queries
  // ================================

  /**
   * Load suppliers for dropdown selection.
   * Uses shared hook for consistent caching and error handling.
   */
  const suppliersQuery = useSuppliersQuery(open);

  /**
   * Load items based on selected supplier and search query.
   * Uses shared hook with client-side supplier filtering.
   */
  const itemsQuery = useItemSearchQuery(selectedSupplier, itemQuery);

  /**
   * Fetch full item details including current quantity.
   * Uses shared hook for consistent data fetching.
   */
  const itemDetailsQuery = useItemDetailsQuery(selectedItem?.id);

  // ================================
  // Form Management
  // ================================
  
  const {
    handleSubmit,
    formState: { isSubmitting },
    reset,
    setValue,
  } = useForm<DeleteItemForm>({
    resolver: zodResolver(deleteItemSchema),
    defaultValues: {
      itemId: '',
    },
  });

  // ================================
  // Effects
  // ================================

  /**
   * Reset item search when supplier changes.
   * Prevents cross-supplier item selection errors.
   * 
   * @enterprise
   * Clears item selection and search query to ensure data integrity
   * when switching between suppliers.
   */
  React.useEffect(() => {
    setSelectedItem(null);
    setItemQuery('');
    setValue('itemId', '');
    setFormError('');
    setShowConfirmation(false);
  }, [selectedSupplier, setValue]);

  /**
   * Pre-fill form with item ID when item is selected.
   * 
   * @enterprise
   * Sets itemId for backend API call
   */
  React.useEffect(() => {
    if (selectedItem) {
      setValue('itemId', selectedItem.id);
    }
  }, [selectedItem, setValue]);

  // ================================
  // Event Handlers
  // ================================

  /**
   * Handle dialog close with complete state cleanup.
   * Ensures clean state for next dialog open session.
   * 
   * @enterprise
   * Prevents state pollution between dialog sessions that could
   * lead to confusing user experiences or data integrity issues.
   * Resets all form fields, selections, and error messages.
   */
  const handleClose = () => {
    setSelectedSupplier(null);
    setSelectedItem(null);
    setItemQuery('');
    setFormError('');
    setShowConfirmation(false);
    setDeletionReason('');
    reset();
    onClose();
  };

  /**
   * Handle cancel button click during confirmation.
   * Shows a message and returns to item selection.
   */
  const handleCancelConfirmation = () => {
    toast(
      t('inventory:status.operationCanceled', 'Operation cancelled'),
      'info'
    );
    setShowConfirmation(false);
  };

  /**
   * Handle form submission - show confirmation dialog.
   * 
   * @enterprise
   * - Validates item selection before showing confirmation
   * - Provides user-facing confirmation with item details
   * - On confirm, calls backend API to delete
   */
  const onSubmit = handleSubmit(async () => {
    if (!selectedItem) {
      setFormError(t('errors:inventory.selection.noItemSelected', 'Please select an item.'));
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  });

  /**
   * Handle confirmed deletion.
   * Calls backend API to delete the item.
   * Handles error cases: quantity > 0, not found, access denied, etc.
   */
  const onConfirmedDelete = async () => {
    if (!selectedItem) {
      setFormError(t('errors:inventory.selection.noItemSelected', 'Please select an item.'));
      return;
    }

    if (!deletionReason) {
      setFormError(t('errors:inventory.selection.noReasonSelected', 'Please select a deletion reason.'));
      return;
    }

    setFormError('');
    setShowConfirmation(false);

    try {
      const success = await deleteItem(selectedItem.id, deletionReason);

      if (success.ok) {
        toast(
          t('inventory:status.itemDeletedSuccessfully', 'Operation successful. Item was removed from inventory!'),
          'success'
        );
        onItemDeleted();
        handleClose();
      } else if (success.error?.includes('still have') || 
                 success.error?.includes('merchandise') || 
                 success.error?.includes('stock')) {
        // Backend error: quantity > 0
        setFormError(
          t('errors:inventory.businessRules.quantityMustBeZero', 
            'You still have merchandise in stock. You need to first remove items from stock by changing quantity.')
        );
        // Don't auto-close, let user click OK to return to inventory
        setShowConfirmation(false);
      } else if (success.error?.includes('Admin') || success.error?.includes('Access denied')) {
        setFormError(t('errors:inventory.businessRules.adminOnly', 'Only administrators can delete items.'));
      } else if (success.error?.includes('404') || success.error?.includes('not found')) {
        setFormError(t('errors:inventory.businessRules.itemNotFound', 'Item not found.'));
      } else {
        setFormError(success.error || t('errors:inventory.requests.failedToDeleteItem', 'Failed to delete item. Please try again.'));
      }
    } catch (error) {
      console.error('Delete item error:', error);
      setFormError(t('errors:inventory.requests.failedToDeleteItem', 'Failed to delete item. Please try again.'));
    }
  };

  return (
    <>
      {/* Main delete item dialog */}
      <Dialog open={open && !showConfirmation} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              {t('inventory:dialogs.deleteItemTitle', 'Delete Item')}
            </Box>
            <Tooltip title={t('actions.help', 'Help')}>
              <IconButton size="small" onClick={() => openHelp('inventory.deleteItem')}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
            
            {/* Error Display */}
            {formError && (
              <Alert severity="error" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            )}

            {/* Step 1: Supplier Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {t('inventory:steps.selectSupplier')}
              </Typography>
              
              {suppliersQuery.isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    {t('common:loading', 'Loading...')}
                  </Typography>
                </Box>
              ) : (
                <FormControl fullWidth>
                  <InputLabel id="supplier-select-label">
                    {t('inventory:table.supplier', 'Supplier')}
                  </InputLabel>
                  <Select
                    labelId="supplier-select-label"
                    value={selectedSupplier?.id ?? ''}
                    onChange={(e) => {
                      const supplier = suppliersQuery.data?.find(
                        (s) => String(s.id) === String(e.target.value)
                      );
                      setSelectedSupplier(supplier ?? null);
                    }}
                    label={t('inventory:table.supplier', 'Supplier')}
                  >
                    {suppliersQuery.data?.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <Divider />

            {/* Step 2: Item Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {t('inventory:steps.selectItem')}
              </Typography>
              
              {!selectedSupplier ? (
                <Alert severity="info">
                  {t('inventory:search.selectSupplierFirst', 'Select a supplier to enable search.')}
                </Alert>
              ) : itemsQuery.isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    {t('common:loading', 'Loading...')}
                  </Typography>
                </Box>
              ) : (
                <Autocomplete
                  key={selectedSupplier?.id}
                  disabled={!selectedSupplier}
                  options={itemsQuery.data ?? []}
                  getOptionLabel={(option) => option.name}
                  value={selectedItem}
                  onChange={(_e, value) => {
                    setSelectedItem(value);
                    setItemQuery('');
                  }}
                  inputValue={itemQuery}
                  onInputChange={(_e, value) => setItemQuery(value)}
                  noOptionsText={
                    itemQuery.length < 2 
                      ? t('inventory:search.typeToSearch', 'Type at least 2 characters to search')
                      : t('inventory:search.noItemsFound', 'No items found for this search.')
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('inventory:item', 'Item')}
                      placeholder={t('inventory:search.typeToSearchItems', 'Type to search items...')}
                    />
                  )}
                />
              )}
            </Box>

            {/* Step 3: Select Deletion Reason */}
            {selectedItem && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('inventory:steps.selectReason', 'Step 3: Select Deletion Reason')}
                  </Typography>
                  
                  <FormControl fullWidth>
                    <InputLabel>
                      {t('inventory:deleteFlow.deletionReasonLabel', 'Deletion Reason')}
                    </InputLabel>
                    <Select
                      label={t('inventory:deleteFlow.deletionReasonLabel', 'Deletion Reason')}
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                    >
                      <MenuItem value="SCRAPPED">
                        {t('inventory:reasons.reasonScrapped', 'Scrapped - Quality control removal')}
                      </MenuItem>
                      <MenuItem value="DESTROYED">
                        {t('inventory:reasons.reasonDestroyed', 'Destroyed - Catastrophic loss')}
                      </MenuItem>
                      <MenuItem value="DAMAGED">
                        {t('inventory:reasons.reasonDamaged', 'Damaged - Quality hold')}
                      </MenuItem>
                      <MenuItem value="EXPIRED">
                        {t('inventory:reasons.reasonExpired', 'Expired - Expiration date breach')}
                      </MenuItem>
                      <MenuItem value="LOST">
                        {t('inventory:reasons.reasonLost', 'Lost - Inventory shrinkage')}
                      </MenuItem>
                      <MenuItem value="RETURNED_TO_SUPPLIER">
                        {t('inventory:reasons.reasonReturnedToSupplier', 'Returned to Supplier - Defective merchandise')}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </>
            )}

            {/* Step 4: Current Item Info (show only if selected) */}
            {selectedItem && itemDetailsQuery.data && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    {t('inventory:dialogs.itemInfoTitle', 'Item Information')}
                  </Typography>

                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: 'action.hover', 
                    borderRadius: 1, 
                    mb: 1
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('inventory:table.name', 'Name')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {itemDetailsQuery.data.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {t('inventory:table.onHand', 'On-hand')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {itemDetailsQuery.data.onHand}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {t('inventory:buttons.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={onSubmit}
            variant="contained"
            color="error"
            disabled={!selectedItem || isSubmitting}
          >
            {isSubmitting ? (
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
        open={showConfirmation}
        onClose={handleCancelConfirmation}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('inventory:dialogs.confirmDeleteTitle', 'Confirm Deletion')}
        </DialogTitle>
        
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('inventory:deleteFlow.warning', 'This action cannot be reversed!!')}
          </Alert>

          <Typography variant="body1" gutterBottom>
            {t('inventory:deleteFlow.confirmMessage', 'Are you sure you want to delete this item?')}
          </Typography>

          {selectedItem && itemDetailsQuery.data && (
            <Box sx={{ 
              p: 1.5, 
              bgcolor: 'action.hover', 
              borderRadius: 1, 
              mt: 2
            }}>
              <Typography variant="body2" color="text.secondary">
                {t('inventory:table.name', 'Item')}
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {itemDetailsQuery.data.name}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ gap: 1 }}>
          <Button 
            onClick={handleCancelConfirmation} 
            disabled={isSubmitting}
          >
            {t('inventory:buttons.no', 'No')}
          </Button>
          <Button
            onClick={onConfirmedDelete}
            variant="contained"
            color="error"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
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
