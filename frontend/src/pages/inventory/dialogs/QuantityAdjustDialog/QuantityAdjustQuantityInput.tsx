/**
 * @file QuantityAdjustQuantityInput.tsx
 * @module dialogs/QuantityAdjustDialog/QuantityAdjustQuantityInput
 *
 * @summary
 * Specialized component for quantity and reason input.
 * Pure presentation component with form field rendering.
 *
 * @enterprise
 * - Single responsibility: render quantity input and reason selector
 * - Accepts control from react-hook-form
 * - Displays validation errors and helpful hints
 * - Disabled until item is selected
 */

import * as React from 'react';
import { TextField, FormControl, InputLabel, Select, MenuItem, Typography, Box } from '@mui/material';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { QuantityAdjustForm } from '../../../../api/inventory/validation';

/**
 * Stock change reason options.
 * Mirrors the backend StockChangeReason enum for audit trail consistency.
 */
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

/**
 * Props for QuantityAdjustQuantityInput component.
 * 
 * @interface QuantityAdjustQuantityInputProps
 * @property {Control<QuantityAdjustForm>} control - react-hook-form control
 * @property {FieldErrors<QuantityAdjustForm>} errors - Form validation errors
 * @property {boolean} disabled - Whether inputs are disabled
 * @property {number} currentQty - Current quantity for hint text
 */
interface QuantityAdjustQuantityInputProps {
  control: Control<QuantityAdjustForm>;
  errors: FieldErrors<QuantityAdjustForm>;
  disabled: boolean;
  currentQty: number;
}

/**
 * Step 3: Quantity and reason input component.
 * 
 * Renders:
 * - Number input for new quantity (must be ≥ 0)
 * - Dropdown for selecting stock change reason
 * 
 * Validation:
 * - Shows field-level errors from Zod validation
 * - Provides helpful hint showing quantity change delta
 * - Disables fields until item is selected
 * 
 * @component
 * @param props - Component props
 * @returns JSX element for quantity and reason inputs
 * 
 * @example
 * ```tsx
 * <QuantityAdjustQuantityInput
 *   control={form.control}
 *   errors={form.formState.errors}
 *   disabled={!form.selectedItem}
 *   currentQty={form.effectiveCurrentQty}
 *   newQty={newQuantityValue}
 * />
 * ```
 */
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
