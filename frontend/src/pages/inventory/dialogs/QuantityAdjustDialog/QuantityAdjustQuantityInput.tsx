/**
 * @file QuantityAdjustQuantityInput.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustQuantityInput
 *
 * @summary
 * Step 3 of the quantity-adjust form: new-quantity numeric input and
 * reason dropdown.
 *
 * @enterprise
 * - The reason dropdown is direction-aware. It watches the live
 *   newQuantity and compares it to the item's current quantity: increasing
 *   stock offers the increase reasons, reducing offers the reduce reasons,
 *   and before any change (equal quantities) it offers the full union. The
 *   option lists come from the validation module so the dropdown and the
 *   schema share one source of truth and cannot drift. The schema is the
 *   authority; this filtering is the UX guard that keeps invalid options
 *   off screen.
 * - Reason labels are derived from the enum value via lower-casing,
 *   replacing underscores, and looking up the key in
 *   inventory:stockReasons.* with the value as the English fallback.
 *   English fallback is CM-APP9 territory; per-key audit at refactor.
 */

import * as React from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Typography, Box } from '@mui/material';
import { Controller, useWatch, type Control, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  INCREASE_ADJUST_REASONS,
  DECREASE_ADJUST_REASONS,
  ADJUST_REASONS,
  type QuantityAdjustForm,
} from '../../../../api/inventory/validation';

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

  // Watch the live new-quantity so the reason options track the direction
  // of the change as the user types.
  const watchedNewQty = useWatch({ control, name: 'newQuantity' });
  const newQty = typeof watchedNewQty === 'number' ? watchedNewQty : 0;
  const delta = newQty - currentQty;
  const reasonOptions =
    delta > 0 ? INCREASE_ADJUST_REASONS : delta < 0 ? DECREASE_ADJUST_REASONS : ADJUST_REASONS;

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
              {reasonOptions.map((reason) => (
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
