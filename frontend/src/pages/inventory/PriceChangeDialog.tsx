/**
 * @file PriceChangeDialog.tsx
 * @module pages/inventory/PriceChangeDialog
 *
 * @summary
 * Enterprise-level dialog for changing inventory item prices with business reasoning.
 * Implements a three-step workflow: supplier selection  item selection  price adjustment.
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
import { changePrice } from '../../api/inventory/mutations';
import { searchItemsForSupplier } from '../../api/analytics/search';
import { getPriceTrend } from '../../api/analytics/priceTrend';
import { getSuppliersLite } from '../../api/analytics/suppliers';
import http from '../../api/httpClient';
import { priceChangeSchema } from './validation';
import type { PriceChangeForm } from './validation';

const PRICE_CHANGE_REASONS = [
  'INITIAL_STOCK',
  'MANUAL_UPDATE',
] as const;

export interface PriceChangeDialogProps {
  open: boolean;
  onClose: () => void;
  onPriceChanged: () => void;
}

interface SupplierOption {
  id: string | number;
  label: string;
}

interface ItemOption {
  id: string;
  name: string;
  onHand: number;
  price: number;
}

export const PriceChangeDialog: React.FC<PriceChangeDialogProps> = ({
  open,
  onClose,
  onPriceChanged,
}) => {
  const { t } = useTranslation(['common', 'inventory']);
  const toast = useToast();
  
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null);
  const [itemQuery, setItemQuery] = React.useState('');
  const [formError, setFormError] = React.useState<string>('');

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
    staleTime: 5 * 60 * 1000,
  });

  const itemsQuery = useQuery({
    queryKey: ['inventory', 'search', selectedSupplier?.id, itemQuery],
    queryFn: async () => {
      if (!selectedSupplier) return [];
      
      // Use searchItemsForSupplier which calls the backend with supplierId
      // Note: Backend may not filter by supplierId, so we apply client-side filtering
      const items = await searchItemsForSupplier(
        String(selectedSupplier.id),
        itemQuery,
        500 // Fetch more items since we'll filter client-side
      );
      
      // CRITICAL: Apply client-side supplier filtering (backend doesn't filter properly)
      // This matches the pattern used in QuantityAdjustDialog.tsx
      const supplierIdStr = String(selectedSupplier.id);
      const supplierFiltered = items.filter(
        (item) => String(item.supplierId ?? '') === supplierIdStr
      );
      
      // ItemRef only has id, name, supplierId - we'll fetch full details on selection
      return supplierFiltered.map((item): ItemOption => ({
        id: item.id,
        name: item.name,
        onHand: 0, // Will be fetched when item is selected
        price: 0,  // Will be fetched when item is selected
      }));
    },
    enabled: !!selectedSupplier && itemQuery.length >= 2,
    staleTime: 30_000,
  });

  const priceHistoryQuery = useQuery({
    queryKey: ['priceHistory', selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem?.id) return [];
      
      try {
        const pricePoints = await getPriceTrend(selectedItem.id, { 
          supplierId: selectedSupplier?.id ? String(selectedSupplier.id) : undefined 
        });
        
        return pricePoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } catch (error) {
        console.error('Failed to fetch price history:', error);
        return [];
      }
    },
    enabled: !!selectedItem?.id,
    staleTime: 30_000,
  });

  /** Fetch full item details including current price and quantity when item is selected */
  const itemDetailsQuery = useQuery({
    queryKey: ['itemDetails', selectedItem?.id],
    queryFn: async () => {
      if (!selectedItem?.id) return null;
      
      try {
        const response = await http.get(`/api/inventory/${encodeURIComponent(selectedItem.id)}`);
        const data = response.data;
        
        // Extract the current price and quantity from the response
        return {
          id: String(data.id || ''),
          name: String(data.name || ''),
          onHand: Number(data.quantity || data.onHand || 0),
          price: Number(data.price || 0),
          code: data.code || null,
          supplierId: data.supplierId || null,
        };
      } catch (error) {
        console.error('Failed to fetch item details:', error);
        return null;
      }
    },
    enabled: !!selectedItem?.id,
    staleTime: 30_000,
  });
  
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
      reason: 'MANUAL_UPDATE' as const,
    },
  });

  React.useEffect(() => {
    setSelectedItem(null);
    setItemQuery('');
    setValue('itemId', '');
    setValue('newPrice', 0);
    setFormError('');
  }, [selectedSupplier, setValue]);

  React.useEffect(() => {
    if (selectedItem && itemDetailsQuery.data) {
      setValue('itemId', selectedItem.id);
      setValue('newPrice', itemDetailsQuery.data.price);
    }
  }, [selectedItem, itemDetailsQuery.data, setValue]);

  const handleClose = () => {
    setSelectedSupplier(null);
    setSelectedItem(null);
    setItemQuery('');
    setFormError('');
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedItem) {
      setFormError(t('inventory:noItemSelected', 'Please select an item to change price.'));
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
          t('inventory:priceUpdatedTo', 'Price changed to ${{price}}', {
            price: values.newPrice.toFixed(2),
          }),
          'success'
        );
        onPriceChanged();
        handleClose();
      } else {
        setFormError(t('inventory:priceChangeFailed', 'Failed to change price. Please try again.'));
      }
    } catch (error) {
      console.error('Price change error:', error);
      setFormError(t('inventory:priceChangeFailed', 'Failed to change price. Please try again.'));
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('inventory:changePrice', 'Change Price')}
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
          
          {formError && (
            <Alert severity="error" onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}

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
                      {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {selectedItem && (
              <Box sx={{ display: 'grid', gap: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  {t('inventory:selectedItem', 'Selected Item')}: {selectedItem.name}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('inventory:currentPrice', 'Current Price')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {itemDetailsQuery.isLoading ? (
                      <CircularProgress size={16} />
                    ) : (
                      `$${(itemDetailsQuery.data?.price ?? 0).toFixed(2)}`
                    )}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('inventory:currentQuantity', 'Current Quantity')}:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {itemDetailsQuery.isLoading ? (
                      <CircularProgress size={16} />
                    ) : (
                      itemDetailsQuery.data?.onHand ?? 0
                    )}
                  </Typography>
                </Box>

                {priceHistoryQuery.data && priceHistoryQuery.data.length > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('inventory:priceHistory', 'Price History')}:
                    </Typography>
                    <Typography variant="body2">
                      {priceHistoryQuery.data.length} {t('inventory:pricePoints', 'price changes')}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" gutterBottom color="primary">
              {t('inventory:step3ChangePrice', 'Step 3: Change Price')}
            </Typography>
            
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
                  label={t('inventory:newPrice', 'New Price')}
                  type="number"
                  fullWidth
                  disabled={!selectedItem}
                  slotProps={{ 
                    htmlInput: { 
                      min: 0, 
                      step: 0.01,
                      style: { textAlign: 'right' }
                    },
                    input: {
                      startAdornment: <Typography variant="body2" sx={{ mr: 0.5 }}>$</Typography>
                    }
                  }}
                  error={!!errors.newPrice}
                  helperText={
                    errors.newPrice?.message ||
                    (selectedItem && itemDetailsQuery.data && value !== itemDetailsQuery.data.price && (
                      t('inventory:priceChangeFromTo', 'Change from ${{from}} to ${{to}}', {
                        from: itemDetailsQuery.data.price.toFixed(2),
                        to: value.toFixed(2),
                      })
                    ))
                  }
                />
              )}
            />

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
                    {PRICE_CHANGE_REASONS.map((reason) => (
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
            t('inventory:applyPriceChange', 'Apply Price Change')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
