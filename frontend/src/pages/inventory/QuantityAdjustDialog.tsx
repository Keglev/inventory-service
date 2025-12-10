/**
 * @file QuantityAdjustDialog.tsx
 * @module pages/inventory/QuantityAdjustDialog
 *
 * @summary
 * Enterprise-level dialog for adjusting inventory item quantities with business reasoning.
 * Implements a guided workflow: supplier selection → item selection → quantity adjustment.
 *
 * @enterprise
 * - Strict validation: quantity ≥ 0 (cannot be negative)
 * - Audit trail: mandatory reason selection from predefined options
 * - User experience: guided workflow prevents invalid operations
 * - Type safety: fully typed with Zod validation and TypeScript
 * - Accessibility: proper form labels, error states, and keyboard navigation
 * - Internationalization: complete i18n support for all user-facing text
 * - Shared data hooks: uses centralized hooks for consistent caching and error handling
 *
 * @workflow
 * 1. User selects supplier from dropdown (via useSuppliersQuery)
 * 2. System loads available items for that supplier (via useItemSearchQuery with client-side filtering)
 * 3. User selects specific item to adjust
 * 4. System fetches full item details (via useItemDetailsQuery)
 * 5. User enters new quantity (≥ 0) and selects business reason
 * 6. System validates and applies quantity change with audit trail
 *
 * @validation
 * - Supplier must be selected before item selection is enabled
 * - Item must be selected before quantity adjustment is enabled
 * - New quantity must be non-negative (≥ 0)
 * - Business reason must be selected from predefined options
 * - Read-only fields (name, price) cannot be modified
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
  Stack,
} from '@mui/material';
import { HelpIconButton } from '../../features/help';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { adjustQuantity } from '../../api/inventory/mutations';
import { getPriceTrend } from '../../api/analytics/priceTrend';
import { quantityAdjustSchema, type QuantityAdjustForm } from '../../api/inventory/validation';
import type { SupplierOption, ItemOption } from '../../api/analytics/types';
import { useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery } from '../../api/inventory/hooks/useInventoryData';

/**
 * Business reasons for stock quantity changes.
 * Mirrors the backend StockChangeReason enum for audit trail consistency.
 * 
 * @enterprise
 * These values provide traceability for all stock movements and support
 * regulatory compliance, financial reconciliation, and operational analytics.
 */
const STOCK_CHANGE_REASONS = [
  'INITIAL_STOCK',    // Added new stock - increases inventory
  'MANUAL_UPDATE',
  'SOLD',
  'SCRAPPED',
  'DESTROYED',
  'DAMAGED',
  'EXPIRED',
  'LOST',
  'RETURNED_TO_SUPPLIER',
  'RETURNED_BY_CUSTOMER',
] as const;

/**
 * Properties for the QuantityAdjustDialog component.
 * 
 * @interface QuantityAdjustDialogProps
 * @property {boolean} open - Controls dialog visibility
 * @property {() => void} onClose - Callback when dialog is closed
 * @property {() => void} onAdjusted - Callback when quantity is successfully adjusted
 */
export interface QuantityAdjustDialogProps {
  /** Controls dialog visibility state */
  open: boolean;
  /** Callback invoked when dialog should be closed */
  onClose: () => void;
  /** Callback invoked after successful quantity adjustment */
  onAdjusted: () => void;
  /**
   * When true, dialog behaves as demo-readonly:
   * user can explore the workflow but cannot commit changes.
   */
  readOnly?: boolean;
}

/**
 * Enterprise-level quantity adjustment dialog component.
 * 
 * Provides a guided workflow for adjusting inventory quantities with proper
 * validation, audit trails, and user experience optimizations.
 * 
 * @component
 * @example
 * ```tsx
 * <QuantityAdjustDialog
 *   open={isDialogOpen}
 *   onClose={() => setIsDialogOpen(false)}
 *   onAdjusted={() => {
 *     refreshInventoryList();
 *     showSuccessMessage();
 *   }}
 * />
 * ```
 * 
 * @enterprise
 * - Implements step-by-step validation to prevent user errors
 * - Provides clear feedback on current item state (current quantity)
 * - Maintains audit trail through mandatory reason selection
 * - Prevents negative quantities that would cause system inconsistencies
 * - Supports internationalization for global deployment
 * - Uses shared data hooks for consistent behavior across dialogs
 * 
 * @refactored
 * - Data fetching centralized via hooks/useInventoryData.ts
 * - Type definitions shared via types/inventory-dialog.types.ts
 * - Eliminates code duplication with PriceChangeDialog
 */
export const QuantityAdjustDialog: React.FC<QuantityAdjustDialogProps> = ({
  open,
  onClose,
  onAdjusted,
  readOnly = false,
}) => {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();

  // ================================
  // State Management
  // ================================
  
  /** Currently selected supplier for item filtering */
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  
  /** Currently selected item for quantity adjustment */
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null);
  
  /** Search query for item filtering */
  const [itemQuery, setItemQuery] = React.useState('');
  
  /** Form error message for user feedback */
  const [formError, setFormError] = React.useState<string>('');

  // ================================
  // Data Queries
  // ================================

  /**
   * Load suppliers for dropdown.
   * Uses shared hook for consistent caching and error handling.
   */
  const suppliersQuery = useSuppliersQuery(open);

  /**
   * Load items based on selected supplier and search query.
   * Uses shared hook with client-side supplier filtering.
   */
  const itemsQuery = useItemSearchQuery(selectedSupplier, itemQuery);

  /**
   * Fetch current price for the selected item.
   * Uses price trend API to get the most recent price.
   */
  const itemPriceQuery = useQuery({
    queryKey: ['itemPrice', selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem?.id) return null;
      
      try {
        // Get recent price trend to find the most current price
        const pricePoints = await getPriceTrend(selectedItem.id, { 
          supplierId: selectedSupplier?.id ? String(selectedSupplier.id) : undefined 
        });
        
        // Return the most recent price, or fall back to item's current price
        if (pricePoints.length > 0) {
          // Sort by date and get the latest
          const latestPrice = pricePoints[pricePoints.length - 1];
          return latestPrice.price;
        }
        
        return selectedItem.price;
      } catch (error) {
        console.error('Failed to fetch item price:', error);
        return selectedItem.price;
      }
    },
    enabled: !!selectedItem?.id,
    staleTime: 30_000,
  });

  /**
   * Fetch full item details including current quantity when item is selected.
   * Uses shared hook for consistent data fetching.
   */
  const itemDetailsQuery = useItemDetailsQuery(selectedItem?.id);

  /**
   * Effective current quantity:
   * - Prefer value from itemDetailsQuery (GET /api/inventory/{id})
   * - Fall back to selectedItem.onHand (search placeholder) if details not loaded yet
   */
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
  } = useForm<QuantityAdjustForm>({
    resolver: zodResolver(quantityAdjustSchema),
    defaultValues: {
      itemId: '',
      newQuantity: 0,
      reason: 'MANUAL_UPDATE' as const,
    },
  });

  // ================================
  // Effects
  // ================================

  /**
   * Reset item search when supplier changes.
   * Prevents cross-supplier item selection errors.
   */
  React.useEffect(() => {
    setSelectedItem(null);
    setItemQuery('');
    setValue('itemId', '');
    setValue('newQuantity', 0);
    setFormError('');
  }, [selectedSupplier, setValue]);

  /**
   * Update form value when item is selected.
   * Use current quantity from selected item data.
   */
  React.useEffect(() => {
    if (selectedItem && itemDetailsQuery.data) {
      setValue('itemId', selectedItem.id);
      setValue('newQuantity', itemDetailsQuery.data.onHand);
    }
  }, [selectedItem, itemDetailsQuery.data, setValue]);

  // ================================
  // Event Handlers
  // ================================

  /**
   * Handle dialog close with state cleanup.
   * Ensures clean state for next dialog open.
   * 
   * @enterprise
   * Prevents state pollution between dialog sessions that could
   * lead to confusing user experiences or data integrity issues.
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
   * Handle form submission with quantity adjustment.
   * Validates input and applies quantity change with audit trail.
   * 
   * @param values - Validated form data
   * 
   * @enterprise
   * - Calculates quantity delta for backend compatibility
   * - Maintains audit trail through reason tracking
   * - Provides user feedback on operation success/failure
   * - Triggers parent component refresh for data consistency
   */
  const onSubmit = handleSubmit(async (values) => {
    if (!selectedItem) {
      setFormError(t('errors:inventory.selection.noItemSelected', 'Please select an item to adjust.'));
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
      // Use the actual current quantity from the fetched item details
      const actualCurrentQty = effectiveCurrentQty;
      
      // Calculate the delta from the ACTUAL current quantity
      const delta = values.newQuantity - actualCurrentQty;
      
      const success = await adjustQuantity({
        id: values.itemId,
        delta,
        reason: values.reason,
      });

      if (success) {
        // Show success message with the new quantity
        toast(
          t('inventory:quantity.quantityUpdatedTo', 'Quantity changed to {{quantity}}', {
            quantity: values.newQuantity,
          }),
          'success'
        );
        onAdjusted();
        handleClose();
      } else {
        setFormError(t('errors.inventory.requests.failedToAdjustQuantity', 'Failed to adjust quantity. Please try again.'));
      }
    } catch (error) {
      console.error('Quantity adjustment error:', error);
      setFormError(t('errors.inventory.requests.failedToAdjustQuantity', 'Failed to adjust quantity. Please try again.'));
    }
  });

  // ================================
  // Render
  // ================================

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            {t('inventory:toolbar.adjustQty', 'Adjust Quantity')}
          </Box>
          <HelpIconButton
            topicId="inventory.adjustQuantity"
            tooltip={t('actions.help', 'Help')}
          />
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
              
              {/* Current Price */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('inventory:price.currentPrice', 'Current Price')}:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {itemPriceQuery.isLoading ? (
                    <CircularProgress size={16} />
                  ) : itemPriceQuery.data !== null && itemPriceQuery.data !== undefined ? (
                    `$${itemPriceQuery.data.toFixed(2)}`
                  ) : (
                    `$${(selectedItem?.price ?? 0).toFixed(2)}`
                  )}
                </Typography>
              </Box>
            </Box>
          )}

          <Divider />

          {/* Step 3: Quantity Adjustment */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="primary">
                {t('inventory:steps.adjustQuantity')}
            </Typography>
            
            {/* New Quantity Input */}
            <Controller
              name="newQuantity"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <TextField
                  {...field}
                  value={value}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange(val === '' ? 0 : Number(val));
                  }}
                  label={t('inventory:quantity.newQuantity', 'New Quantity')}
                  type="number"
                  fullWidth
                  disabled={!selectedItem}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  error={!!errors.newQuantity}
                  helperText={
                    errors.newQuantity?.message ||
                    (selectedItem && (
                      t('inventory:quantity.QuantityChangeHint', 'Changing from {{current}} to {{new}}', {
                        current: effectiveCurrentQty,
                        new: value,
                      })
                    ))
                  }
                />
              )}
            />

            {/* Reason Selection */}
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth sx={{ mt: 2 }} disabled={!selectedItem}>
                  <InputLabel id="reason-select-label" error={!!errors.reason}>
                    {t('inventory:fields.reasonLabel', 'Reason')}
                  </InputLabel>
                  <Select
                    {...field}
                    labelId="reason-select-label"
                    label={t('inventory:fields.reasonLabel', 'Reason')}
                    error={!!errors.reason}
                  >
                    {STOCK_CHANGE_REASONS.map((reason) => (
                      <MenuItem key={reason} value={reason}>
                        {t(`inventory:stockReasons.${reason.toLowerCase()}`, reason.replace(/_/g, ' '))}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.reason && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                      {errors.reason.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          {t('common:actions.cancel', 'Cancel')}
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
            t('inventory:buttons.applyAdjustment', 'Apply Adjustment')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
