/**
 * @file QuantityAdjustQuantityInput.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustQuantityInput
 *
 * @summary
 * Step 3 of the quantity-adjust form: new-quantity numeric input and
 * reason dropdown.
 *
 * @enterprise
 * - STOCK_CHANGE_REASONS lists ALL 11 values of the locked
 *   StockChangeReason enum, including reasons that do not fit the
 *   quantity-adjust semantics: INITIAL_STOCK is for item creation, and
 *   the removal cluster (SCRAPPED, DESTROYED, DAMAGED, EXPIRED, LOST,
 *   RETURNED_TO_SUPPLIER) overlaps with the delete flow's authoritative
 *   subset. The backend StockHistoryValidator decides what actually
 *   reaches StockHistory, so offering all 11 is fail-loose -- some
 *   selections will be rejected at the API boundary.
 *   Tracked under CB-APP60 -- restrict the list to the adjustment-valid
 *   subset (e.g. MANUAL_UPDATE, SOLD, RETURNED_BY_CUSTOMER, plus any
 *   reasons the backend genuinely accepts here).
 * - This is the visible site for CB-E's loose-reason policy:
 *   quantityAdjustSchema uses z.string().min(1) rather than an enum,
 *   so the schema does not constrain the value; the backend is the
 *   only authority.
 * - Reason labels are derived from the enum value via lower-casing,
 *   replacing underscores, and looking up the key in
 *   inventory:stockReasons.* with the value as the English fallback.
 *   English fallback is CM-APP9 territory; per-key audit at refactor.
 */

import * as React from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Typography, Box } from '@mui/material';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { QuantityAdjustForm } from '../../../../api/inventory/validation';

// BUCKET: CB-APP60 -- all 11 enum values exposed including non-adjust-valid ones. Restrict to backend-accepted subset.
const STOCK_CHANGE_REASONS = [
  'INITIAL_STOCK',
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

interface QuantityAdjustQuantityInputProps {
  control: Control<QuantityAdjustForm>;
  errors: FieldErrors<QuantityAdjustForm>;
  disabled: boolean;
  currentQty: number;
}

export const QuantityAdjustQuantityInput: React.FC<QuantityAdjustQuantityInputProps> = ({
  control,
  errors,
  disabled,
  currentQty,
}) => {
  const { t } = useTranslation(['common', 'inventory', 'errors']);

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom color="primary">
        {t('inventory:steps.adjustQuantity', 'Step 3: Adjust Quantity')}
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
            label={t('inventory:quantity.newQuantity', 'New Quantity')}
            type="number"
            fullWidth
            disabled={disabled}
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            error={!!errors.newQuantity}
            helperText={
              errors.newQuantity?.message ||
              (currentQty !== undefined &&
                t('inventory:quantity.QuantityChangeHint', 'Changing from {{current}} to {{new}}', {
                  current: currentQty,
                  new: value,
                }))
            }
          />
        )}
      />

      {/* Reason Selection */}
      <Controller
        name="reason"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth sx={{ mt: 2 }} disabled={disabled}>
            <InputLabel id="reason-select-label" error={!!errors.reason}>
              {t('inventory:fields.reasonLabel', 'Reason')}
            </InputLabel>
            <Select
              {...field}
              labelId="reason-select-label"
              label={t('inventory:fields.reasonLabel', 'Reason')}
              error={!!errors.reason}
            >
              {STOCK_CHANGE_REASONS.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {t(`inventory:stockReasons.${reason.toLowerCase()}`, reason.replace(/_/g, ' '))}
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
  );
};
