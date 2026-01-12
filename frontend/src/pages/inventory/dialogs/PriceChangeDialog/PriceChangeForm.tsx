/**
 * PriceChangeForm - Multi-step form for changing inventory item prices
 * 
 * @module dialogs/PriceChangeDialog/PriceChangeForm
 * @description
 * Renders three-step workflow: supplier selection → item search → price adjustment.
 * 
 * Step 1: Select supplier from dropdown (enables item search)
 * Step 2: Search and select item via Autocomplete (enables price change)
 * Step 3: Enter new price with current price display
 * 
 * Uses shared form state from usePriceChangeForm hook.
 */

import {
  Box,
  TextField,
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
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PriceChangeItemDetails } from './PriceChangeItemDetails';
import type { UsePriceChangeFormReturn } from './usePriceChangeForm';

/**
 * PriceChangeForm - Render all form fields
 * 
 * @param state - Complete form state and handlers from usePriceChangeForm
 * 
 * @enterprise
 * - Step-by-step validation: each step enables the next
 * - Supplier selection dropdown with loading state
 * - Item Autocomplete with search (min 2 chars) and loading state
 * - Selected item details panel (current price, quantity)
 * - New price field with helper text showing price change
 * - Error banner for non-field errors
 */
export function PriceChangeForm({ state }: { state: UsePriceChangeFormReturn }) {
  const { t } = useTranslation(['common', 'inventory', 'errors']);

  return (
    <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
      {/* Error banner for non-field errors */}
      {state.formError && (
        <Alert severity="error" onClose={() => state.setFormError(null)}>
          {state.formError}
        </Alert>
      )}

      {/* Step 1: Supplier Selection */}
      <Box>
        <Typography variant="subtitle2" gutterBottom color="primary">
          {t('inventory:steps.selectSupplier', 'Step 1: Select Supplier')}
        </Typography>
        <FormControl
          fullWidth
          size="small"
          disabled={state.suppliersLoading}
          data-testid="supplier-form-control"
        >
          <InputLabel>{t('inventory:table.supplier', 'Supplier')}</InputLabel>
          <Select
            value={state.selectedSupplier?.id || ''}
            label={t('inventory:table.supplier', 'Supplier')}
            onChange={(e) => {
              const supplierId = e.target.value;
              const supplier =
                state.suppliers.find((s) => String(s.id) === String(supplierId)) || null;
              state.setSelectedSupplier(supplier);
            }}
            disabled={state.suppliersLoading}
          >
            <MenuItem value="">
              <em>{t('common:selectOption', 'Select an option')}</em>
            </MenuItem>
            {state.suppliers.map((supplier) => (
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
          {t('inventory:steps.selectItem', 'Step 2: Search and Select Item')}
        </Typography>
        <Autocomplete
          fullWidth
          size="small"
          options={state.items}
          getOptionLabel={(option) => option.name}
          value={state.selectedItem}
          onChange={(_, newValue) => state.setSelectedItem(newValue)}
          inputValue={state.itemQuery}
          onInputChange={(_, newInputValue) => state.setItemQuery(newInputValue)}
          disabled={!state.selectedSupplier}
          loading={state.itemsLoading}
          noOptionsText={
            state.itemQuery.length < 2
              ? t('inventory:search.typeToSearch', 'Type at least 2 characters to search')
              : t('inventory:search.noItemsFound', 'No items found')
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('inventory:search.searchSelectItem', 'Search and select item...')}
              placeholder={
                !state.selectedSupplier
                  ? t('inventory:search.selectSupplierFirst', 'Select supplier first')
                  : undefined
              }
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {state.itemsLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          sx={{ mb: 2 }}
        />
      </Box>

      {/* Selected Item Details */}
      <PriceChangeItemDetails
        item={state.selectedItem}
        currentPrice={state.effectiveCurrentPrice}
        currentQty={state.effectiveCurrentQty}
        loading={state.itemDetailsLoading}
      />

      <Divider />

      {/* Step 3: Price Change */}
      <Box>
        <Typography variant="subtitle2" gutterBottom color="primary">
          {t('inventory:steps.changePrice', 'Step 3: Enter New Price')}
        </Typography>
        <Controller
          name="newPrice"
          control={state.control}
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
              disabled={!state.selectedItem}
              slotProps={{
                htmlInput: {
                  min: 0,
                  step: 0.01,
                },
              }}
              error={!!state.formState.errors.newPrice}
              helperText={
                typeof state.formState.errors.newPrice?.message === 'string'
                  ? state.formState.errors.newPrice.message
                  : state.selectedItem
                    ? t('inventory:price.priceChange', 'Change from {{from}} to {{to}}', {
                        from: state.effectiveCurrentPrice.toFixed(2),
                        to: Number(value).toFixed(2),
                      })
                    : ''
              }
            />
          )}
        />
      </Box>
    </Box>
  );
}
