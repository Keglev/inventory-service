/**
 * @file ItemForm.tsx
 * @module pages/inventory/dialogs/ItemFormDialog/ItemForm
 *
 * @summary
 * Field layout for the create-or-edit item flow: supplier, name, code,
 * quantity, price, and (create-mode only) reason. Wired to the shared
 * react-hook-form instance from useItemForm.
 *
 * @enterprise
 * - Reason dropdown renders only in create mode (gated by !initial?.id).
 *   In edit mode the existing item already has a creation reason on its
 *   StockHistory and re-prompting would be misleading; price/quantity
 *   edits go through dedicated dialogs (PriceChangeDialog,
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
import type { SupplierOption } from '../../../../api/analytics/types';
import type { UpsertItemForm } from '../../validation/inventoryValidation';
import type { InventoryRow } from '../../../../api/inventory/types';
import type { UseItemFormReturn } from './useItemForm';

/**
 * ItemForm - Render all form fields
 * 
 * @param state - Complete form state and handlers from useItemForm
 * @param initial - Initial item data for checking edit mode
 * 
 * @enterprise
 * - Error banner at top for generic form errors
 * - Supplier Autocomplete fully controlled to prevent desync
 * - Code / SKU field editable, required
 * - Quantity and price with numeric constraints
 * - Reason dropdown only shown in create mode (no initial?.id)
 */
const CREATE_REASON_OPTIONS = [
  { value: 'INITIAL_STOCK', i18nKey: 'stockReasons.initial_stock' },
  { value: 'MANUAL_UPDATE', i18nKey: 'stockReasons.manual_update' },
] as const;

export function ItemForm({
  state,
  initial,
}: {
  state: UseItemFormReturn;
  initial?: InventoryRow | null;
}) {
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
            label={t('inventory:table.supplier', 'Supplier')}
            error={!!state.formState.errors.supplierId}
            helperText={typeof state.formState.errors.supplierId?.message === 'string' 
              ? state.formState.errors.supplierId.message 
              : ''}
          />
        )}
      />

      {/* Name field */}
      <TextField
        label={t('inventory:table.name', 'Item')}
        {...state.register('name')}
        error={!!state.formState.errors.name}
        helperText={typeof state.formState.errors.name?.message === 'string'
          ? state.formState.errors.name.message
          : ''}
      />

      {/* Code / SKU field - required, unique per item (backend-enforced) */}
      <TextField
        label={t('inventory:table.code', 'Code / SKU')}
        {...state.register('code')}
        error={!!state.formState.errors.code}
        helperText={typeof state.formState.errors.code?.message === 'string'
          ? state.formState.errors.code.message
          : ''}
      />

      {/* Quantity field */}
      <TextField
        label={t('inventory:table.quantity', 'Initial Stock')}
        type="number"
        slotProps={{ htmlInput: { min: 0 } }}
        {...state.register('quantity', { valueAsNumber: true })}
        error={!!state.formState.errors.quantity}
        helperText={typeof state.formState.errors.quantity?.message === 'string'
          ? state.formState.errors.quantity.message
          : ''}
      />

      {/* Price field */}
      <TextField
        label={t('inventory:table.price', 'Price')}
        type="number"
        slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
        {...state.register('price', { valueAsNumber: true })}
        error={!!state.formState.errors.price}
        helperText={typeof state.formState.errors.price?.message === 'string'
          ? state.formState.errors.price.message
          : ''}
        InputProps={{
          startAdornment: <span style={{ marginRight: '8px' }}>€</span>,
        }}
      />

      {/* Reason dropdown - Create mode only */}
      {!initial?.id && (
        <FormControl error={!!state.formState.errors.reason}>
          <InputLabel id="reason-label">
            {t('inventory:fields.reasonLabel', 'Reason')}
          </InputLabel>
          <Select
            labelId="reason-label"
            label={t('inventory:fields.reasonLabel', 'Reason')}
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
              {typeof state.formState.errors.reason.message === 'string'
                ? state.formState.errors.reason.message
                : ''}
            </Box>
          )}
        </FormControl>
      )}
    </Box>
  );
}
