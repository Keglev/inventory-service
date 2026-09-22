/**
 * @file ItemForm.tsx
 * @module pages/inventory/dialogs/ItemFormDialog/ItemForm
 *
 * @summary
 * Field layout for the create-item flow: supplier, name, code,
 * quantity, price, and reason. Wired to the shared react-hook-form
 * instance from useItemForm.
 *
 * @enterprise
 * - The reason records why the first stock exists. Later price and
 *   quantity changes go through dedicated dialogs (PriceChangeDialog,
 *   QuantityAdjustDialog) with their own reason flows.
 * - Reason options are limited to INITIAL_STOCK | MANUAL_UPDATE -- the
 *   exact 2-value subset enforced by itemFormSchema and by the backend
 *   for create/upsert. The locked 11-value StockChangeReason enum covers
 *   removals and other flows; those reasons do not apply to creation.
 * - CREATE_REASON_OPTIONS is a module-level const (the create-mode
 *   reason subset is static and never recreated per render).
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { fieldErrorText } from '../../../../utils/fieldErrorText';
import type { SupplierOption } from '../../../../api/analytics/types';
import type { UpsertItemForm } from '../../validation/inventoryValidation';
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
const CREATE_REASON_OPTIONS = [
  { value: 'INITIAL_STOCK', i18nKey: 'stockReasons.initial_stock' },
  { value: 'MANUAL_UPDATE', i18nKey: 'stockReasons.manual_update' },
] as const;

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
          const nextSupplierId: UpsertItemForm['supplierId'] =
            opt ? (opt.id as UpsertItemForm['supplierId']) : ('' as UpsertItemForm['supplierId']);
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

      {/* Reason dropdown */}
      <FormControl error={!!state.formState.errors.reason}>
        <InputLabel id="reason-label">
          {t('inventory:fields.reasonLabel')}
        </InputLabel>
        <Select
          labelId="reason-label"
          label={t('inventory:fields.reasonLabel')}
          value={state.watch('reason') ?? 'INITIAL_STOCK'}
          onChange={(e) =>
            state.setValue('reason', e.target.value as UpsertItemForm['reason'], {
              shouldValidate: true,
            })
          }
        >
          {/* Render all reason options */}
          {CREATE_REASON_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {t(`inventory:${opt.i18nKey}`, opt.value)}
            </MenuItem>
          ))}
        </Select>
        {state.formState.errors.reason?.message && (
          <Box sx={{ mt: 0.5, color: 'error.main', fontSize: 12 }}>
            {fieldErrorText(state.formState.errors.reason, t)}
          </Box>
        )}
      </FormControl>
    </Box>
  );
}
