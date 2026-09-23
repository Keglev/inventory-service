/**
 * @file ItemForm.tsx
 * @module pages/inventory/dialogs/ItemFormDialog/ItemForm
 *
 * @summary
 * Field layout for the create-item flow: supplier, name, code,
 * quantity and price. Wired to the shared react-hook-form
 * instance from useItemForm.
 *
 * @enterprise
 * - No reason field: the first stock of a new item is always recorded as
 *   INITIAL_STOCK by the backend. Later price and quantity changes go
 *   through dedicated dialogs (PriceChangeDialog, QuantityAdjustDialog),
 *   which carry their own reasons.
 * - Code / SKU field is editable and required (backend-enforced unique),
 *   reflecting the current backend behavior that codes are not yet
 *   user-editable. Will revisit if the backend exposes code edits.
 * - Price field uses a Euro adornment, consistent with the German-first
 *   appearance policy.
 */

import {
  Box,
  TextField,
  Autocomplete,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { fieldErrorText } from '../../../../utils/fieldErrorText';
import type { SupplierOption } from '../../../../api/analytics/types';
import type { CreateItemForm } from '../../validation/inventoryValidation';
import type { UseItemFormReturn } from './useItemForm';

/**
 * ItemForm - Render all form fields
 * 
 * @param state - Complete form state and handlers from useItemForm
 * 
 * @enterprise
 * - Error banner at top for generic form errors
 * - Supplier Autocomplete fully controlled to prevent desync
 * - Code / SKU field editable, required
 * - Quantity and price with numeric constraints
 */
export function ItemForm({ state }: { state: UseItemFormReturn }) {
  const { t } = useTranslation(['common', 'inventory', 'errors']);

  return (
    <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
      {/* Error banner for non-field errors */}
      {state.formError && <Alert severity="error">{state.formError}</Alert>}

      {/* Supplier - Controlled Autocomplete */}
      <Autocomplete<SupplierOption, false, false, false>
        options={state.suppliers}
        value={state.supplierValue}
        onChange={(_, opt) => {
          state.setSupplierValue(opt);
          // Update RHF with supplier ID
          const nextSupplierId: CreateItemForm['supplierId'] =
            opt ? (opt.id as CreateItemForm['supplierId']) : ('' as CreateItemForm['supplierId']);
          state.setValue('supplierId', nextSupplierId, { shouldValidate: true });
        }}
        getOptionLabel={(o) => o.label}
        isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
        renderInput={(p) => (
          <TextField
            {...p}
            label={t('inventory:table.supplier')}
            error={!!state.formState.errors.supplierId}
            helperText={fieldErrorText(state.formState.errors.supplierId, t)}
          />
        )}
      />

      {/* Name field */}
      <TextField
        label={t('inventory:table.name')}
        {...state.register('name')}
        error={!!state.formState.errors.name}
        helperText={fieldErrorText(state.formState.errors.name, t)}
      />

      {/* Code / SKU field - required, unique per item (backend-enforced) */}
      <TextField
        label={t('inventory:table.code')}
        {...state.register('code')}
        error={!!state.formState.errors.code}
        helperText={fieldErrorText(state.formState.errors.code, t)}
      />

      {/* Quantity field */}
      <TextField
        label={t('inventory:table.quantity')}
        type="number"
        slotProps={{ htmlInput: { min: 1 } }}
        {...state.register('quantity', { valueAsNumber: true })}
        error={!!state.formState.errors.quantity}
        helperText={fieldErrorText(state.formState.errors.quantity, t)}
      />

      {/* Price field */}
      <TextField
        label={t('inventory:table.price')}
        type="number"
        slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }}
        {...state.register('price', { valueAsNumber: true })}
        error={!!state.formState.errors.price}
        helperText={fieldErrorText(state.formState.errors.price, t)}
        InputProps={{
          startAdornment: <span style={{ marginRight: '8px' }}>€</span>,
        }}
      />
    </Box>
  );
}
