/**
 * @file SupplierItemSelector.tsx
 * @module pages/inventory/components/SupplierItemSelector
 *  // Use shared item search hook (we manage selected item externally)
  const {
    itemQuery,
    setItemQuery,
    itemOptions,
    isSearchLoading: itemsLoading,
    isSearchError: itemsError,
  } = useItemSearch({ supplierId: selectedSupplierId });ary
 * Reusable two-step selector component for supplier → item selection workflow.
 * Used across quantity adjustment and price change dialogs for consistent UX.
 *
 * @enterprise
 * - Guided workflow: supplier must be selected before items are available
 * - Performance: supplier-scoped item filtering reduces load and improves UX
 * - Type safety: fully typed with proper error handling and loading states
 * - Accessibility: proper labels, descriptions, and keyboard navigation
 * - Internationalization: complete i18n support for all user-facing text
 *
 * @workflow
 * 1. User selects supplier from dropdown (required)
 * 2. Component automatically loads items for selected supplier
 * 3. User can search/select from supplier-specific items
 * 4. Selected item details are displayed for confirmation
 */

import * as React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getSuppliersLite } from '../../../api/analytics/suppliers';
import { useItemSearch } from '../hooks/useItemSearch';
import { ItemAutocompleteOption } from './ItemAutocompleteOption';
import type { ItemRef } from '../../../api/analytics/types';

/**
 * Props for the supplier-item selector component.
 */
export interface SupplierItemSelectorProps {
  /** Currently selected supplier ID */
  selectedSupplierId: string;
  
  /** Function to handle supplier selection change */
  onSupplierChange: (supplierId: string) => void;
  
  /** Currently selected item */
  selectedItem: ItemRef | null;
  
  /** Function to handle item selection change */
  onItemChange: (item: ItemRef | null) => void;
  
  /** Optional error message for supplier selection */
  supplierError?: string;
  
  /** Optional error message for item selection */
  itemError?: string;
  
  /** Whether the selector is disabled */
  disabled?: boolean;
  
  /** Optional additional content to show for selected item */
  selectedItemContent?: React.ReactNode;
}

/**
 * Reusable supplier and item selector component.
 * Implements the common supplier → item selection pattern used across inventory dialogs.
 * 
 * @enterprise
 * This component encapsulates the complex logic of supplier-scoped item selection,
 * including loading states, error handling, and proper user feedback.
 */
export const SupplierItemSelector: React.FC<SupplierItemSelectorProps> = ({
  selectedSupplierId,
  onSupplierChange,
  selectedItem,
  onItemChange,
  supplierError,
  itemError,
  disabled = false,
  selectedItemContent,
}) => {
  const { t } = useTranslation();

  // Load suppliers for dropdown
  const {
    data: suppliers = [],
    isLoading: suppliersLoading,
    error: suppliersError,
  } = useQuery({
    queryKey: ['suppliers', 'lite'],
    queryFn: getSuppliersLite,
  });

  // Use shared item search hook (we manage selected item externally)
  const {
    itemQuery,
    setItemQuery,
    itemOptions,
    isSearchLoading: itemsLoading,
    isSearchError: itemsError,
  } = useItemSearch({ supplierId: selectedSupplierId });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Step 1: Supplier Selection */}
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('inventory.step1SelectSupplier', 'Step 1: Select Supplier')}
        </Typography>
        
        <FormControl fullWidth error={!!supplierError} disabled={disabled}>
          <InputLabel id="supplier-select-label">
            {t('inventory.supplier', 'Supplier')}
          </InputLabel>
          <Select
            labelId="supplier-select-label"
            value={selectedSupplierId}
            label={t('inventory.supplier', 'Supplier')}
            onChange={(e) => onSupplierChange(e.target.value)}
          >
            <MenuItem value="">
              <em>{t('common.selectOption', 'Select an option')}</em>
            </MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {suppliersLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {t('common.loading', 'Loading...')}
            </Typography>
          </Box>
        )}
        
        {suppliersError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {t('inventory.errorLoadingSuppliers', 'Error loading suppliers')}
          </Alert>
        )}
        
        {supplierError && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {supplierError}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Step 2: Item Selection */}
      <Box>
        <Typography variant="h6" gutterBottom>
          {t('inventory.step2SelectItem', 'Step 2: Select Item')}
        </Typography>
        
        <Autocomplete
          options={itemOptions}
          value={selectedItem}
          onChange={(_, newValue) => onItemChange(newValue)}
          inputValue={itemQuery}
          onInputChange={(_, newInputValue) => setItemQuery(newInputValue)}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('inventory.searchItems', 'Search items...')}
              error={!!itemError}
              helperText={itemError}
              disabled={!selectedSupplierId || disabled}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {itemsLoading && <CircularProgress size={16} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <ItemAutocompleteOption {...props} item={option} />
          )}
          loading={itemsLoading}
          disabled={!selectedSupplierId || disabled}
          noOptionsText={
            !selectedSupplierId
              ? t('inventory.selectSupplierFirst', 'Please select a supplier first')
              : itemQuery
              ? t('inventory.noItemsFound', 'No items found')
              : t('inventory.typeToSearch', 'Type to search for items')
          }
        />
        
        {itemsError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {t('inventory.errorLoadingItems', 'Error loading items')}
          </Alert>
        )}
      </Box>

      {/* Selected Item Display */}
      {selectedItem && (
        <>
          <Divider />
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('inventory.selectedItem', 'Selected Item')}
            </Typography>
            
            <Box sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {selectedItem.name}
              </Typography>
              {selectedItemContent}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};