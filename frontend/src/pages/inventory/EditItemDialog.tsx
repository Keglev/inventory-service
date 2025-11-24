/**
 * @file EditItemDialog.tsx
 * @module pages/inventory/EditItemDialog
 *
 * @summary
 * Enterprise-level dialog for editing inventory item names.
 * Implements a guided workflow: supplier selection → item selection → name change.
 *
 * @enterprise
 * - Strict validation: supplier must be selected before item search is enabled
 * - User experience: guided workflow prevents invalid operations
 * - Type safety: fully typed with Zod validation and TypeScript
 * - Accessibility: proper form labels, error states, and keyboard navigation
 * - Internationalization: complete i18n support for all user-facing text
 * - Shared data hooks: uses centralized hooks for consistent caching and error handling
 * - Authorization: only ADMIN users can change item names
 *
 * @workflow
 * 1. User selects supplier from dropdown (via useSuppliersQuery)
 * 2. System enables item search for that supplier (via useItemSearchQuery with client-side filtering)
 * 3. User searches and selects specific item (type-ahead with 2+ characters)
 * 4. System fetches and displays current item details (via useItemDetailsQuery)
 * 5. User enters new item name
 * 6. System validates and applies name change
 *
 * @validation
 * - Supplier must be selected before item search is enabled
 * - Item must be selected before name change is enabled
 * - New name must not be empty and must be different from current name
 * - New name must not already exist for the same supplier
 *
 * @backend_api
 * PATCH /api/inventory/{id}/name?name={newName}
 * - Only ADMIN role can use this endpoint
 * - Returns updated inventory item with new name
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
  TextField,
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
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../app/ToastContext';
import { renameItem } from '../../api/inventory/mutations';
import { editItemSchema } from './validation';
import type { EditItemForm } from './validation';
import type { SupplierOption, ItemOption } from './types/inventory-dialog.types';
import { useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery } from './hooks/useInventoryData';

/**
 * Properties for the EditItemDialog component.
 * 
 * @interface EditItemDialogProps
 * @property {boolean} open - Controls dialog visibility
 * @property {() => void} onClose - Callback when dialog is closed
 * @property {() => void} onItemRenamed - Callback when item is successfully renamed
 */
export interface EditItemDialogProps {
  /** Controls dialog visibility state */
  open: boolean;
  /** Callback invoked when dialog should be closed */
  onClose: () => void;
  /** Callback invoked after successful item rename to refresh parent data */
  onItemRenamed: () => void;
}

/**
 * Enterprise-level edit item dialog component.
 * 
 * Provides a guided workflow for renaming inventory items with proper validation,
 * and user experience optimizations.
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
 * - Implements step-by-step validation to prevent user errors
 * - Provides clear feedback on current item state (current name)
 * - Prevents duplicate names that would cause business logic errors
 * - Supports internationalization for global deployment
 * - Uses shared data hooks for consistent behavior across dialogs
 * - Only allows ADMIN users to rename items
 * 
 * @refactored
 * - Data fetching centralized via hooks/useInventoryData.ts
 * - Type definitions shared via types/inventory-dialog.types.ts
 * - Eliminates code duplication with PriceChangeDialog
 */
export const EditItemDialog: React.FC<EditItemDialogProps> = ({
  open,
  onClose,
  onItemRenamed,
}) => {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();

  // ================================
  // State Management
  // ================================
  
  /** Currently selected supplier for item filtering */
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  
  /** Currently selected item for name change */
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null);
  
  /** Search query for item autocomplete filtering (minimum 2 characters) */
  const [itemQuery, setItemQuery] = React.useState('');
  
  /** Form error message for user feedback */
  const [formError, setFormError] = React.useState<string>('');

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
   * Fetch full item details including current name and other info.
   * Uses shared hook for consistent data fetching.
   */
  const itemDetailsQuery = useItemDetailsQuery(selectedItem?.id);

  // ================================
  // Form Management
  // ================================
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<EditItemForm>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      itemId: '',
      newName: '',
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
    setValue('newName', '');
    setFormError('');
  }, [selectedSupplier, setValue]);

  /**
   * Pre-fill form with actual current name when item is selected.
   * Uses fetched item details (not placeholder values from search).
   * 
   * @enterprise
   * - Waits for itemDetailsQuery to complete before setting values
   * - Sets itemId for backend API call
   * - Pre-fills newName with actual current name for user convenience
   */
  React.useEffect(() => {
    if (selectedItem && itemDetailsQuery.data) {
      setValue('itemId', selectedItem.id);
      setValue('newName', itemDetailsQuery.data.name);
    }
  }, [selectedItem, itemDetailsQuery.data, setValue]);

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
    reset();
    onClose();
  };

  /**
   * Handle form submission with name change.
   * Validates input and applies new name to selected item.
   * 
   * @param values - Validated form data containing itemId and newName
   * 
   * @enterprise
   * - Validates item selection before submission
   * - Calls backend API to update name (only ADMIN allowed)
   * - Provides user feedback on operation success/failure
   * - Detects duplicate name conflicts and provides specific error
   * - Triggers parent component refresh for data consistency
   * - Closes dialog automatically on success
   * 
   * @backend_api PATCH /api/inventory/{id}/name?name={newName}
   */
  const onSubmit = handleSubmit(async (values) => {
    if (!selectedItem) {
      setFormError(t('errors:inventory.selection.noItemSelected', 'Please select an item.'));
      return;
    }

    setFormError('');

    try {
      const success = await renameItem({
        id: values.itemId,
        newName: values.newName,
      });

      if (success.ok) {
        toast(
          t('inventory:status.itemRenamed', 'Item name changed successfully!'),
          'success'
        );
        onItemRenamed();
        handleClose();
      } else if (success.error?.includes('Admin') || success.error?.includes('Access denied')) {
        setFormError(t('errors:inventory.adminOnly', 'Only administrators can rename items.'));
      } else if (success.error?.includes('duplicate') || success.error?.includes('already exists')) {
        setFormError(t('errors:inventory.conflicts.duplicateName', 'An item with this name already exists.'));
      } else {
        setFormError(success.error || t('errors:inventory.requests.failedToRenameItem', 'Failed to rename item. Please try again.'));
      }
    } catch (error) {
      console.error('Edit item error:', error);
      setFormError(t('errors:inventory.requests.failedToRenameItem', 'Failed to rename item. Please try again.'));
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('inventory:dialogs.editItemTitle', 'Edit Item')}
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
              {t('inventory:steps.selectSupplier', 'Step 1: Select Supplier')}
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
              {t('inventory:steps.selectItem', 'Step 2: Select Item')}
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
                    label={t('inventory:table.name', 'Item')}
                    placeholder={t('inventory:search.typeToSearchItems', 'Type to search items...')}
                  />
                )}
              />
            )}
          </Box>

          <Divider />

          {/* Step 3: Name Change */}
          {selectedItem && itemDetailsQuery.data && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {t('inventory:steps.editName', 'Step 3: Edit Item Name')}
              </Typography>

              {/* Current Item Info */}
              <Box sx={{ 
                p: 1.5, 
                bgcolor: 'action.hover', 
                borderRadius: 1, 
                mb: 2 
              }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory:quantity.currentItemInfo', 'Current Item Information')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                  {itemDetailsQuery.data.name}
                </Typography>
              </Box>

              {/* New Name Input */}
              <Controller
                name="newName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={t('inventory:table.name', 'Item Name')}
                    placeholder={t('inventory:table.name', 'Item Name')}
                    error={!!errors.newName}
                    helperText={errors.newName?.message}
                    disabled={isSubmitting}
                  />
                )}
              />
            </Box>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
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
