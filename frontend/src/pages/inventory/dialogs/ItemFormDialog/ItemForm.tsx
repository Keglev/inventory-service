/**
 * ItemForm - Multi-field form for creating/editing inventory items
 * 
 * @module dialogs/ItemFormDialog/ItemForm
 * @description
 * Renders form fields for item creation/editing:
 * supplier (Autocomplete) → name → code → quantity → price → reason (create only).
 * 
 * Each field connects to RHF control with validation errors displayed inline.
 * Reason dropdown only visible in create mode (when !initial?.id).
 * Uses shared form state from useItemForm hook.
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
  Tooltip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { SupplierOption } from '../../../../api/analytics/types';
import type { UpsertItemForm } from '../../../../api/inventory/validation';
import type { InventoryRow } from '../../../../api/inventory';
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
 * - Code field read-only with helpful tooltip
 * - Quantity and price with numeric constraints
 * - Reason dropdown only shown in create mode (no initial?.id)
 */
export function ItemForm({
  state,
  initial,
}: {
  state: UseItemFormReturn;
  initial?: InventoryRow | null;
}) {
  const { t } = useTranslation(['common', 'inventory', 'errors']);

  const CREATE_REASON_OPTIONS = [
    { value: 'INITIAL_STOCK', i18nKey: 'stockReasons.initial_stock' },
    { value: 'MANUAL_UPDATE', i18nKey: 'stockReasons.manual_update' },
  ] as const;

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

      {/* Code field - Read-only with tooltip */}
      <Tooltip title={t('inventory:fields.codeReadOnlyHint', 'Optional for now')}>
        <TextField
          label={t('inventory:table.code', 'Code / SKU')}
          {...state.register('code')}
          InputProps={{ readOnly: true }}
          error={!!state.formState.errors.code}
          helperText={typeof state.formState.errors.code?.message === 'string'
            ? state.formState.errors.code.message
            : ''}
        />
      </Tooltip>

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
