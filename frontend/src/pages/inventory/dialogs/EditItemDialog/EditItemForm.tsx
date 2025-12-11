/**
 * EditItemForm - Three-step form for renaming inventory items
 * 
 * @module dialogs/EditItemDialog/EditItemForm
 * @description
 * Renders the guided workflow form with three steps:
 * 1. Supplier selection via dropdown
 * 2. Item search and selection via autocomplete
 * 3. Name change with current name display and validation
 * 
 * Each step is conditionally visible based on previous steps.
 * Uses shared form state from useEditItemForm hook.
 */

import {
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
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { UseEditItemFormReturn } from './useEditItemForm';

/**
 * EditItemForm - Renders three-step edit workflow
 * 
 * @param state - Complete form state and handlers from useEditItemForm
 * 
 * @enterprise
 * - Step 1 always visible (supplier selection)
 * - Step 2 visible only after supplier selected
 * - Step 3 visible only after item selected
 * - Each step shows loading states while data fetches
 * - Error display at top with dismissal capability
 */
export function EditItemForm({ state }: { state: UseEditItemFormReturn }) {
  const { t } = useTranslation(['common', 'inventory', 'errors']);

  return (
    <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
      {/* Error display with dismissal */}
      {state.formError && (
        <Alert severity="error" onClose={() => state.setFormError('')}>
          {state.formError}
        </Alert>
      )}

      {/* ===== STEP 1: Supplier Selection ===== */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {t('inventory:steps.selectSupplier', 'Step 1: Select Supplier')}
        </Typography>

        {/* Show loading spinner while suppliers fetch */}
        {state.suppliersQuery.isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              {t('common:loading', 'Loading...')}
            </Typography>
          </Box>
        ) : (
          <FormControl fullWidth>
            <InputLabel id="edit-supplier-label">
              {t('inventory:table.supplier', 'Supplier')}
            </InputLabel>
            <Select
              labelId="edit-supplier-label"
              value={state.selectedSupplier?.id ?? ''}
              onChange={(e) => {
                // Find supplier object by ID and update state
                // Resets item selection when supplier changes
                const supplier = state.suppliersQuery.data?.find(
                  (s) => String(s.id) === String(e.target.value)
                );
                state.setSelectedSupplier(supplier ?? null);
              }}
              label={t('inventory:table.supplier', 'Supplier')}
            >
              {/* Map all suppliers to menu items */}
              {state.suppliersQuery.data?.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id}>
                  {supplier.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Divider />

      {/* ===== STEP 2: Item Selection ===== */}
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          {t('inventory:steps.selectItem', 'Step 2: Select Item')}
        </Typography>

        {/* Guard: show info message if supplier not selected */}
        {!state.selectedSupplier ? (
          <Alert severity="info">
            {t('inventory:search.selectSupplierFirst', 'Select a supplier to enable search.')}
          </Alert>
        ) : /* Show loading spinner while items fetch */ state.itemsQuery.isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              {t('common:loading', 'Loading...')}
            </Typography>
          </Box>
        ) : (
          <Autocomplete
            /* Re-key when supplier changes to reset autocomplete internal state */
            key={state.selectedSupplier?.id}
            disabled={!state.selectedSupplier}
            options={state.itemsQuery.data ?? []}
            getOptionLabel={(option) => option.name}
            value={state.selectedItem}
            onChange={(_e, value) => {
              state.setSelectedItem(value);
              // Clear search query for clean slate after selection
              state.setItemQuery('');
            }}
            inputValue={state.itemQuery}
            onInputChange={(_e, value) => state.setItemQuery(value)}
            noOptionsText={
              state.itemQuery.length < 2
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

      {/* ===== STEP 3: Name Change ===== */}
      {state.selectedItem && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            {t('inventory:steps.editName', 'Step 3: Edit Item Name')}
          </Typography>

          {/* Display current item name for reference */}
          <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t('inventory:quantity.currentItemInfo', 'Current Item Information')}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
              {/* Show fetched current name if available, fallback to search result */}
              {state.itemDetailsQuery.data?.name ?? state.selectedItem.name}
            </Typography>
          </Box>

          {/* New name input with form validation */}
          <Controller
            name="newName"
            control={state.control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label={t('inventory:table.name', 'Item Name')}
                placeholder={t('inventory:table.name', 'Item Name')}
                error={!!state.formState.errors.newName}
                helperText={typeof state.formState.errors.newName?.message === 'string' ? state.formState.errors.newName.message : ''}
                disabled={state.formState.isSubmitting}
              />
            )}
          />
        </Box>
      )}
    </Box>
  );
}
