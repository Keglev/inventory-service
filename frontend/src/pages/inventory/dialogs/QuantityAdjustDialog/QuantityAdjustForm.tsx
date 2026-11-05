/**
 * @file QuantityAdjustForm.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustForm
 *
 * @summary
 * Three-step form layout for quantity adjustment: supplier select, item select, quantity
 * input.
 *
 * @enterprise
 * - Each visible block is its own sub-component (QuantityAdjustSupplierSelect,
 *   QuantityAdjustItemSelect, SelectedItemDetails, QuantityAdjustQuantityInput),
 *   so each step is swappable.
 * - The form component is pure presentation: every prop is plumbed
 *   from the orchestrator hook; no useState, no useEffect.
 */

import * as React from 'react';
import { Alert, Box, Divider } from '@mui/material';
import { QuantityAdjustSupplierSelect } from './QuantityAdjustSupplierSelect';
import { QuantityAdjustItemSelect } from './QuantityAdjustItemSelect';
import { SelectedItemDetails } from '../SelectedItemDetails';
import { QuantityAdjustQuantityInput } from './QuantityAdjustQuantityInput';
import type { UseQuantityAdjustFormReturn } from './useQuantityAdjustForm';

export interface QuantityAdjustFormProps {
  form: UseQuantityAdjustFormReturn;
}

export const QuantityAdjustForm: React.FC<QuantityAdjustFormProps> = ({ form }) => {

  return (
    <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
      {form.formError && (
        <Alert severity="error" onClose={() => form.setFormError('')}>
          {form.formError}
        </Alert>
      )}

      {/* Step 1: Supplier Selection */}
      <QuantityAdjustSupplierSelect
        selectedSupplier={form.selectedSupplier}
        onSupplierChange={form.setSelectedSupplier}
        suppliers={form.suppliers}
        loading={form.suppliersLoading}
      />

      {/* Step 2: Item Selection */}
      <QuantityAdjustItemSelect
        selectedItem={form.selectedItem}
        onItemChange={form.setSelectedItem}
        searchQuery={form.itemQuery}
        onSearchChange={form.setItemQuery}
        items={form.items}
        loading={form.itemsLoading}
        selectedSupplier={form.selectedSupplier}
      />

      {/* Selected item details, once an item is picked */}
      <SelectedItemDetails
        item={form.selectedItem}
        currentQty={form.effectiveCurrentQty}
        currentPrice={form.effectiveCurrentPrice}
        loading={form.itemDetailsLoading}
      />

      <Divider />

      {/* Step 3: Quantity Adjustment */}
      <QuantityAdjustQuantityInput
        control={form.control}
        errors={form.formState.errors}
        disabled={!form.selectedItem}
        currentQty={form.effectiveCurrentQty}
      />
    </Box>
  );
};
