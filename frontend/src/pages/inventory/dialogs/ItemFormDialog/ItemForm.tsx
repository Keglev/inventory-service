/**
 * @file ItemForm.tsx
 * @module pages/inventory/dialogs/ItemFormDialog/ItemForm
 *
 * @summary
 * Field layout for the create-item flow: supplier, name, code, quantity and price.
 *
 * @enterprise
 * - Wired to the shared react-hook-form instance from useItemForm.
 * - No reason field: the first stock of a new item is always recorded as
 *   INITIAL_STOCK by the backend. Later price and quantity changes go
 *   through dedicated dialogs (PriceChangeDialog, QuantityAdjustDialog),
 *   which carry their own reasons.
 * - Code / SKU is required (backend-enforced unique) and set once, here:
 *   the backend offers no later edit of it.
 * - Price field uses a Euro adornment, consistent with the German-first
 *   appearance policy.
 */

import {
  Box,
  TextField,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { fieldErrorText } from '../../../../utils/fieldErrorText';
import { SupplierPickerField } from '../../../../components/search/SupplierPickerField';
import type { CreateItemForm } from '../../validation/inventoryValidation';
import type { UseItemFormReturn } from './useItemForm';

/**
 * ItemForm - The create-item fields, bound to the form from useItemForm.
 *
 * @param state - Complete form state and handlers from useItemForm
 */
export function ItemForm({ state }: { state: UseItemFormReturn }) {
  const { t } = useTranslation(['common', 'inventory', 'errors']);

  return (
    <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
      {state.formError && <Alert severity="error">{state.formError}</Alert>}

      {/* Supplier: the shared search field, two letters */}
      <SupplierPickerField
        suppliers={state.suppliers}
        loading={state.suppliersLoading}
        value={state.supplierValue}
        onSelect={(opt) => {
          state.setSupplierValue(opt);
          const nextSupplierId: CreateItemForm['supplierId'] =
            opt ? (opt.id as CreateItemForm['supplierId']) : ('' as CreateItemForm['supplierId']);
          state.setValue('supplierId', nextSupplierId, { shouldValidate: true });
        }}
        label={t('inventory:table.supplier')}
        errorText={fieldErrorText(state.formState.errors.supplierId, t)}
      />

      <TextField
        label={t('inventory:table.name')}
        {...state.register('name')}
        error={!!state.formState.errors.name}
        helperText={fieldErrorText(state.formState.errors.name, t)}
      />

      {/* Code / SKU: required, unique per item (backend-enforced) */}
      <TextField
        label={t('inventory:table.code')}
        {...state.register('code')}
        error={!!state.formState.errors.code}
        helperText={fieldErrorText(state.formState.errors.code, t)}
      />

      <TextField
        label={t('inventory:table.quantity')}
        type="number"
        slotProps={{ htmlInput: { min: 1 } }}
        {...state.register('quantity', { valueAsNumber: true })}
        error={!!state.formState.errors.quantity}
        helperText={fieldErrorText(state.formState.errors.quantity, t)}
      />

      <TextField
        label={t('inventory:table.price')}
        type="number"
        slotProps={{
          htmlInput: { min: 0.01, step: 0.01 },
          input: { startAdornment: <span style={{ marginRight: '8px' }}>€</span> },
        }}
        {...state.register('price', { valueAsNumber: true })}
        error={!!state.formState.errors.price}
        helperText={fieldErrorText(state.formState.errors.price, t)}
      />
    </Box>
  );
}
