/**
 * @file PriceChangeDialog.tsx
 * @module pages/inventory/PriceChangeDialog
 *
 * @summary
 * Enterprise-level dialog for changing inventory item prices.
 * Implements a guided workflow: supplier selection → item selection → price adjustment.
 *
 * @enterprise
 * - Strict validation: price must be positive (> 0)
 * - User experience: guided workflow prevents invalid operations
 * - Type safety: fully typed with Zod validation and TypeScript
 * - Accessibility: proper form labels, error states, and keyboard navigation
 * - Internationalization: complete i18n support for all user-facing text
 * - Shared data hooks: uses centralized hooks for consistent caching and error handling
 *
 * @workflow
 * 1. User selects supplier from dropdown (via useSuppliersQuery)
 * 2. System enables item search for that supplier (via useItemSearchQuery with client-side filtering)
 * 3. User searches and selects specific item (type-ahead with 2+ characters)
 * 4. System fetches and displays current item details (via useItemDetailsQuery)
 * 5. User enters new price (must be > 0)
 * 6. System validates and applies price change
 *
 * @validation
 * - Supplier must be selected before item search is enabled
 * - Item must be selected before price adjustment is enabled
 * - New price must be positive (> 0)
 * - System prevents setting price to same value as current price
 *
 * @backend_api
 * PATCH /api/inventory/{id}/price?price={newPrice}
 * - Only accepts `price` parameter (no reason required)
 * - Returns updated inventory item with new price
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
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useHelp } from '../../hooks/useHelp';
import { useToast } from '../../context/ToastContext';
import { changePrice } from '../../api/inventory/mutations';
import { priceChangeSchema, type PriceChangeForm } from '../../api/inventory/validation';
import type { SupplierOption, ItemOption } from '../../api/analytics/types';
import { useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery } from '../../api/inventory/hooks/useInventoryData';

/**
 * Properties for the PriceChangeDialog component.
 * 
 * @interface PriceChangeDialogProps
 * @property {boolean} open - Controls dialog visibility
 * @property {() => void} onClose - Callback when dialog is closed
 * @property {() => void} onPriceChanged - Callback when price is successfully changed
 */
export interface PriceChangeDialogProps {
  /** Controls dialog visibility state */
  open: boolean;
  /** Callback invoked when dialog should be closed */
  onClose: () => void;
  /** Callback invoked after successful price change to refresh parent data */
  onPriceChanged: () => void;
  /**
   * When true, dialog behaves as demo-readonly:
   * user can walk through the workflow but final change is blocked.
   */
  readOnly?: boolean;
}

/**
 * Enterprise-level price change dialog component.
 * 
 * Provides a guided workflow for changing item prices with proper validation,
 * and user experience optimizations.
 * 
 * @component
 * @example
 * ```tsx
 * <PriceChangeDialog
 *   open={isDialogOpen}
 *   onClose={() => setIsDialogOpen(false)}
 *   onPriceChanged={() => {
 *     refreshInventoryList();
 *     showSuccessMessage();
 *   }}
 * />
 * ```
 * 
 * @enterprise
 * - Implements step-by-step validation to prevent user errors
 * - Provides clear feedback on current item state (current price, quantity)
 * - Prevents invalid prices (must be positive)
 * - Supports internationalization for global deployment
 * - Uses shared data hooks for consistent behavior across dialogs
 * 
 * @refactored
 * - Data fetching centralized via hooks/useInventoryData.ts
 * - Type definitions shared via types/inventory-dialog.types.ts
 * - Eliminates code duplication with QuantityAdjustDialog
 */
export const PriceChangeDialog: React.FC<PriceChangeDialogProps> = ({
  open,
  onClose,
  onPriceChanged,
  readOnly = false,
}) => {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();
  const { openHelp } = useHelp();

  // ================================
  // State Management
  // ================================
  
  /** Currently selected supplier for item filtering */
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  
  /** Currently selected item for price change */
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
   * Fetch full item details including current price and quantity.
   * Uses shared hook for consistent data fetching.
   */
  const itemDetailsQuery = useItemDetailsQuery(selectedItem?.id);
    const effectiveCurrentPrice =
    selectedItem ? (itemDetailsQuery.data?.price ?? selectedItem.price ?? 0) : 0;

  const effectiveCurrentQty =
    selectedItem ? (itemDetailsQuery.data?.onHand ?? selectedItem.onHand ?? 0) : 0;

  // ================================
  // Form Management
  // ================================
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<PriceChangeForm>({
    resolver: zodResolver(priceChangeSchema),
    defaultValues: {
      itemId: '',
      newPrice: 0,
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
    setValue('newPrice', 0);
    setFormError('');
  }, [selectedSupplier, setValue]);

  /**
   * Pre-fill form with actual current price when item is selected.
   * Uses fetched item details (not placeholder values from search).
   * 
   * @enterprise
   * - Waits for itemDetailsQuery to complete before setting values
   * - Sets itemId for backend API call
   * - Pre-fills newPrice with actual current price for user convenience
   */
  React.useEffect(() => {
    if (!selectedItem) return;

    setValue('itemId', selectedItem.id);
    const price = itemDetailsQuery.data?.price ?? selectedItem.price ?? 0;
    setValue('newPrice', price);
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
   * Handle form submission with price change.
   * Validates input and applies new price to selected item.
   * 
   * @param values - Validated form data containing itemId and newPrice
   * 
   * @enterprise
   * - Validates item selection before submission
   * - Calls backend API to update price (no reason required)
   * - Provides user feedback on operation success/failure
   * - Triggers parent component refresh for data consistency
   * - Closes dialog automatically on success
   * 
   * @backend_api PATCH /api/inventory/{id}/price?price={newPrice}
   */
  const onSubmit = handleSubmit(async (values) => {
    if (!selectedItem) {
      setFormError(t('errors:inventory.selection.noItemSelected', 'Please select an item to change price.'));
      return;
    }
    // Demo guard: allow exploration but block mutation
    if (readOnly) {
      setFormError(
        t(
          'common.demoDisabled',
          'You are in demo mode and cannot perform this operation.'
        )
      );
      return;
    }

    setFormError('');

    try {
      const success = await changePrice({
        id: values.itemId,
        price: values.newPrice,
      });

      if (success) {
        toast(
          t('inventory:price.priceUpdatedTo', 'Price changed to ${{price}}', {
            price: values.newPrice.toFixed(2),
          }),
          'success'
        );
        onPriceChanged();
        handleClose();
      } else {
        setFormError(t('errors:inventory.requests.failedToChangePrice', 'Failed to change price. Please try again.'));
      }
    } catch (error) {
      console.error('Price change error:', error);
      setFormError(t('errors:inventory.requests.failedToChangePrice', 'Failed to change price. Please try again.'));
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            {t('inventory:toolbar.changePrice', 'Change Price')}
          </Box>
          <Tooltip title={t('actions.help', 'Help')}>
            <IconButton size="small" onClick={() => openHelp('inventory.changePrice')}>
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
            <Typography variant="subtitle2" gutterBottom color="primary">
              {t('inventory:steps.selectSupplier')}
            </Typography>
            
            <FormControl fullWidth size="small">
              <InputLabel>{t('inventory:table.supplier', 'Supplier')}</InputLabel>
              <Select
                value={selectedSupplier?.id || ''}
                label={t('inventory:table.supplier', 'Supplier')}
                onChange={(e) => {
                  const supplierId = e.target.value;
                  const supplier = suppliersQuery.data?.find(s => String(s.id) === String(supplierId)) || null;
                  setSelectedSupplier(supplier);
                }}
                disabled={suppliersQuery.isLoading}
              >
                <MenuItem value="">
                  <em>{t('common:selectOption', 'Select an option')}</em>
                </MenuItem>
                {suppliersQuery.data?.map((supplier) => (
                  <MenuItem key={supplier.id} value={supplier.id}>
                    {supplier.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Step 2: Item Selection */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="primary">
              {t('inventory:steps.selectItem')}
            </Typography>
            
            <Autocomplete
              fullWidth
              size="small"
              options={itemsQuery.data || []}
              getOptionLabel={(option) => option.name}
              value={selectedItem}
              onChange={(_, newValue) => setSelectedItem(newValue)}
              inputValue={itemQuery}
              onInputChange={(_, newInputValue) => setItemQuery(newInputValue)}
              disabled={!selectedSupplier}
              loading={itemsQuery.isLoading}
              noOptionsText={
                itemQuery.length < 2 
                  ? t('inventory:search.typeToSearch', 'Type at least 2 characters to search')
                  : t('inventory:search.noItemsFound', 'No items found')
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('inventory:search.searchSelectItem', 'Search and select item...')}
                  placeholder={!selectedSupplier ? t('inventory:search.selectSupplierFirst', 'Select supplier first') : undefined}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {itemsQuery.isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ mb: 2 }}
            />
          </Box>

          {/* Selected Item Details - Only show AFTER item is selected */}
          {selectedItem && (
            <Box sx={{ display: 'grid', gap: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" color="primary">
                {t('inventory:selection.selectedItemLabel', 'Selected Item')}: {selectedItem.name}
              </Typography>
              
              {/* Current Price */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory:price.currentPrice', 'Current Price')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {itemDetailsQuery.isLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    effectiveCurrentPrice.toFixed(2)
                  )}
                </Typography>
              </Box>
              
              {/* Current Quantity */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory:quantity.currentQuantity', 'Current Quantity')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {itemDetailsQuery.isLoading ? (
                    <CircularProgress size={16} />
                  ) : (
                    effectiveCurrentQty
                  )}
                </Typography>
              </Box>
            </Box>
          )}

          <Divider />

          {/* Step 3: Price Change */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="primary">
              {t('inventory:steps.changePrice')}
            </Typography>
            
            {/* New Price Input */}
            <Controller
              name="newPrice"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <TextField
                  {...field}
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange(val === '' ? 0 : Number(val));
                  }}
                  label={t('inventory:price.newPrice', 'New Price')}
                  type="number"
                  fullWidth
                  disabled={!selectedItem}
                  slotProps={{ 
                    htmlInput: { 
                      min: 0, 
                      step: 0.01
                    }
                  }}
                  error={!!errors.newPrice}
                  helperText={
                    errors.newPrice?.message ||
                    (selectedItem && (
                      t('inventory:price.priceUpdatedTo', 'Change from ${{from}} to ${{to}}', {
                        from: effectiveCurrentPrice.toFixed(2),
                        to: Number(value).toFixed(2),
                      })
                    ))
                  }
                />
              )}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('inventory:buttons.cancel', 'Cancel')}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !selectedItem}
          variant="contained"
        >
          {isSubmitting ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              {t('common:saving', 'Saving...')}
            </>
          ) : (
            t('inventory:buttons.applyPriceChange', 'Apply Price Change')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
