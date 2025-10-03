/**
 * @file QuantityAdjustDialog.tsx
 * @module pages/inventory/QuantityAdjustDialog
 *
 * @summary
 * Enterprise-level dialog for adjusting inventory item quantities with business reasoning.
 * Implements a two-step workflow: supplier selection → item selection → quantity adjustment.
 *
 * @enterprise
 * - Strict validation: quantity ≥ 0 (cannot be negative)
 * - Audit trail: mandatory reason selection from predefined options
 * - User experience: guided workflow prevents invalid operations
 * - Type safety: fully typed with Zod validation and TypeScript
 * - Accessibility: proper form labels, error states, and keyboard navigation
 * - Internationalization: complete i18n support for all user-facing text
 *
 * @workflow
 * 1. User selects supplier from dropdown
 * 2. System loads available items for that supplier
 * 3. User selects specific item to adjust
 * 4. User enters new quantity (≥ 0) and selects business reason
 * 5. System validates and applies quantity change with audit trail
 *
 * @validation
 * - Supplier must be selected before item selection is enabled
 * - Item must be selected before quantity adjustment is enabled
 * - New quantity must be non-negative (≥ 0)
 * - Business reason must be selected from predefined options
 * - Read-only fields (name, price) cannot be modified
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
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../../app/ToastContext';
import { adjustQuantity } from '../../api/inventory/mutations';
import { getInventoryPage } from '../../api/inventory/list';
import { getPriceTrend } from '../../api/analytics/priceTrend';
import { getSuppliersLite } from '../../api/analytics/suppliers';
import { quantityAdjustSchema } from './validation';
import type { QuantityAdjustForm } from './validation';

/**
 * Business reasons for stock quantity changes.
 * Mirrors the backend StockChangeReason enum for audit trail consistency.
 * 
 * @enterprise
 * These values provide traceability for all stock movements and support
 * regulatory compliance, financial reconciliation, and operational analytics.
 */
const STOCK_CHANGE_REASONS = [
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
}

/**
 * Supplier option shape for the autocomplete component.
 * Normalized from backend supplier data for consistent UI handling.
 */
interface SupplierOption {
  /** Unique supplier identifier */
  id: string | number;
  /** Display name for supplier selection */
  label: string;
}

/**
 * Item option shape for the autocomplete component.
 * Normalized from backend inventory data for consistent UI handling.
 */
interface ItemOption {
  /** Unique item identifier */
  id: string;
  /** Display name for item selection */
  name: string;
  /** Current quantity on hand */
  onHand: number;
  /** Current price per unit */
  price: number;
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
 */
export const QuantityAdjustDialog: React.FC<QuantityAdjustDialogProps> = ({
  open,
  onClose,
  onAdjusted,
}) => {
  const { t } = useTranslation(['common', 'inventory']);
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

  /** Load suppliers for dropdown */
  const suppliersQuery = useQuery({
    queryKey: ['suppliers', 'lite'],
    queryFn: async () => {
      const suppliers = await getSuppliersLite();
      return suppliers.map((supplier): SupplierOption => ({
        id: supplier.id,
        label: supplier.name,
      }));
    },
    enabled: open,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  /** Load items based on selected supplier and search query */
  const itemsQuery = useQuery({
    queryKey: ['inventory', 'search', selectedSupplier?.id, itemQuery],
    queryFn: async () => {
      if (!selectedSupplier) return [];
      
      const response = await getInventoryPage({
        page: 1,
        pageSize: 50,
        q: itemQuery,
        supplierId: selectedSupplier.id,
      });
      
      return response.items.map((item): ItemOption => ({
        id: item.id,
        name: item.name,
        onHand: item.onHand,
        price: 0, // Default price since it's not available in InventoryRow
      }));
    },
    enabled: !!selectedSupplier && itemQuery.length >= 2,
    staleTime: 30_000, // 30 seconds
  });

  /** Fetch current price for the selected item */
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
   */
  React.useEffect(() => {
    if (selectedItem) {
      setValue('itemId', selectedItem.id);
      setValue('newQuantity', selectedItem.onHand);
    }
  }, [selectedItem, setValue]);

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
      setFormError(t('inventory:noItemSelected', 'Please select an item to adjust.'));
      return;
    }

    setFormError('');

    try {
      // Calculate the delta from current quantity
      const delta = values.newQuantity - selectedItem.onHand;
      
      const success = await adjustQuantity({
        id: values.itemId,
        delta,
        reason: values.reason,
      });

      if (success) {
        // Show success message with the new quantity
        toast(
          t('inventory:quantityUpdatedTo', 'Quantity changed to {{quantity}}', {
            quantity: values.newQuantity,
          }),
          'success'
        );
        onAdjusted();
        handleClose();
      } else {
        setFormError(t('inventory:adjustmentFailed', 'Failed to adjust quantity. Please try again.'));
      }
    } catch (error) {
      console.error('Quantity adjustment error:', error);
      setFormError(t('inventory:adjustmentFailed', 'Failed to adjust quantity. Please try again.'));
    }
  });

  // ================================
  // Render
  // ================================

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('inventory:adjustQty', 'Adjust Quantity')}
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
              {t('inventory:step1SelectSupplier', 'Step 1: Select Supplier')}
            </Typography>
            
            <FormControl fullWidth size="small">
              <InputLabel>{t('inventory:supplier', 'Supplier')}</InputLabel>
              <Select
                value={selectedSupplier?.id || ''}
                label={t('inventory:supplier', 'Supplier')}
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
              {t('inventory:step2SelectItem', 'Step 2: Select Item')}
            </Typography>
            
            <TextField
              fullWidth
              size="small"
              label={t('inventory:searchItems', 'Search items...')}
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              disabled={!selectedSupplier}
              placeholder={!selectedSupplier ? t('inventory:selectSupplierFirst', 'Select supplier first') : undefined}
              sx={{ mb: 2 }}
            />
            
            {itemsQuery.isLoading && itemQuery.length >= 2 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {t('inventory:loadingItems', 'Loading items...')}
                </Typography>
              </Box>
            )}
            
            {itemsQuery.data && itemsQuery.data.length > 0 && (
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>{t('inventory:selectItem', 'Select Item')}</InputLabel>
                <Select
                  value={selectedItem?.id || ''}
                  label={t('inventory:selectItem', 'Select Item')}
                  onChange={(e) => {
                    const itemId = e.target.value;
                    const item = itemsQuery.data?.find(i => i.id === itemId) || null;
                    setSelectedItem(item);
                  }}
                >
                  <MenuItem value="">
                    <em>{t('common:selectOption', 'Select an option')}</em>
                  </MenuItem>
                  {itemsQuery.data.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name} (Qty: {item.onHand})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {/* Selected Item Details */}
            {selectedItem && (
              <Box sx={{ display: 'grid', gap: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  {t('inventory:selectedItem', 'Selected Item')}: {selectedItem.name}
                </Typography>
                
                {/* Current Quantity */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('inventory:currentQuantity', 'Current Quantity')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedItem.onHand}
                  </Typography>
                </Box>
                
                {/* Current Price */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('inventory:currentPrice', 'Current Price')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {itemPriceQuery.isLoading ? (
                      <CircularProgress size={16} />
                    ) : itemPriceQuery.data !== null && itemPriceQuery.data !== undefined ? (
                      `$${itemPriceQuery.data.toFixed(2)}`
                    ) : (
                      `$${selectedItem.price.toFixed(2)}`
                    )}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Step 3: Quantity Adjustment */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="primary">
              {t('inventory:step3AdjustQuantity', 'Step 3: Adjust Quantity')}
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
                  label={t('inventory:newQuantity', 'New Quantity')}
                  type="number"
                  fullWidth
                  disabled={!selectedItem}
                  slotProps={{ htmlInput: { min: 0, step: 1 } }}
                  error={!!errors.newQuantity}
                  helperText={
                    errors.newQuantity?.message ||
                    (selectedItem && (
                      t('inventory:changeFromTo', 'Change from {{from}} to {{to}}', {
                        from: selectedItem.onHand,
                        to: value,
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
                    {t('inventory:reason', 'Reason')}
                  </InputLabel>
                  <Select
                    {...field}
                    labelId="reason-select-label"
                    label={t('inventory:reason', 'Reason')}
                    error={!!errors.reason}
                  >
                    {STOCK_CHANGE_REASONS.map((reason) => (
                      <MenuItem key={reason} value={reason}>
                        {t(`inventory:reasons.${reason.toLowerCase()}`, reason.replace(/_/g, ' '))}
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
          {t('actions.cancel', 'Cancel')}
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
            t('inventory:applyAdjustment', 'Apply Adjustment')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
