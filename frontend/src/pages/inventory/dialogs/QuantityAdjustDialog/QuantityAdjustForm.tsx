/**
 * @file QuantityAdjustForm.tsx
 * @module pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustForm
 *
 * @summary
 * Three-step form layout for quantity adjustment: supplier select,
 * item select, quantity input. Each step is its own sub-component.
 *
 * @enterprise
 * - Most extracted form layout in the codebase. Where other dialogs
 *   inline their step controls, this one delegates every visible
 *   block to a dedicated sub-component (QuantityAdjustSupplierSelect,
 *   QuantityAdjustItemSelect, QuantityAdjustItemDetails,
 *   QuantityAdjustQuantityInput). The split makes each step swappable.
 * - The form component is pure presentation: every prop is plumbed
 *   from the orchestrator hook; no useState, no useEffect.
 */

import * as React from 'react';
import { Alert, Box, Divider } from '@mui/material';
import { QuantityAdjustSupplierSelect } from './QuantityAdjustSupplierSelect';
import { QuantityAdjustItemSelect } from './QuantityAdjustItemSelect';
import { QuantityAdjustItemDetails } from './QuantityAdjustItemDetails';
import { QuantityAdjustQuantityInput } from './QuantityAdjustQuantityInput';
import type { UseQuantityAdjustFormReturn } from './useQuantityAdjustForm';

interface QuantityAdjustFormProps {
  form: UseQuantityAdjustFormReturn;
}

export const QuantityAdjustForm: React.FC<QuantityAdjustFormProps> = ({ form }) => {

  return (
    <Box sx={{ display: 'grid', gap: 2.5, mt: 1 }}>
      {/* Error Display */}
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

      {/* Selected Item Details - Only show AFTER item is selected */}
      <QuantityAdjustItemDetails
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
