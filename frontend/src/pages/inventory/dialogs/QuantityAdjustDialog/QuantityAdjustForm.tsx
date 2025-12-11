/**
 * @file QuantityAdjustForm.tsx
 * @module dialogs/QuantityAdjustDialog/QuantityAdjustForm
 *
 * @summary
 * Form view component for quantity adjustment workflow.
 * Implements 3-step guided workflow: supplier selection → item selection → quantity adjustment.
 *
 * @enterprise
 * - Pure presentation component with zero business logic
 * - Accepts state object instead of individual props (cleaner interfaces)
 * - Conditional step rendering based on selection state
 * - Comprehensive validation error display
 * - Accessibility: proper labels, error states, keyboard navigation
 * - Internationalization: complete i18n support
 */

import * as React from 'react';
import { Alert, Box, Divider } from '@mui/material';
import { QuantityAdjustSupplierSelect } from './QuantityAdjustSupplierSelect';
import { QuantityAdjustItemSelect } from './QuantityAdjustItemSelect';
import { QuantityAdjustItemDetails } from './QuantityAdjustItemDetails';
import { QuantityAdjustQuantityInput } from './QuantityAdjustQuantityInput';
import type { UseQuantityAdjustFormReturn } from './useQuantityAdjustForm';

/**
 * Props for QuantityAdjustForm component.
 * 
 * @interface QuantityAdjustFormProps
 * @property {UseQuantityAdjustFormReturn} form - Complete form interface from orchestrator hook
 */
interface QuantityAdjustFormProps {
  form: UseQuantityAdjustFormReturn;
}

/**
 * Form view component for quantity adjustment workflow.
 * 
 * Implements 3-step workflow:
 * 1. **Supplier Selection** - Choose supplier from dropdown
 * 2. **Item Selection** - Search and select specific item
 * 3. **Quantity Adjustment** - Enter new quantity and reason
 * 
 * Features:
 * - Delegates each step to specialized components
 * - Error display at top of form
 * - Current item details panel (shows name, current qty, price)
 * - Comprehensive form with all validations
 * 
 * @component
 * @param props - Component props containing form interface
 * @returns JSX element rendering the complete form
 * 
 * @example
 * ```tsx
 * const form = useQuantityAdjustForm(open, onClose, onAdjusted);
 * <QuantityAdjustForm form={form} />
 * ```
 */
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
