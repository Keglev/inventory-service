/**
 * @file useQuantityAdjustForm.ts
 * @module dialogs/QuantityAdjustDialog/useQuantityAdjustForm
 *
 * @summary
 * Thin orchestrator hook composing state, queries, and form management.
 * Provides unified interface for quantity adjustment workflow.
 *
 * @enterprise
 * - Composes specialized hooks (state + queries + form) into single interface
 * - Handles form submission with validation and mutation
 * - Manages dialog lifecycle (open/close with cleanup)
 * - Enforces demo-mode restrictions (readOnly)
 * - Provides comprehensive error handling with user feedback
 */

import { useForm } from 'react-hook-form';
import type { Control, UseFormStateReturn, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast';
import { adjustQuantity } from '../../../../api/inventory/mutations';
import { quantityAdjustSchema, type QuantityAdjustForm } from '../../../../api/inventory/validation';
import { useQuantityAdjustFormState } from './useQuantityAdjustFormState';
import { useQuantityAdjustFormQueries } from './useQuantityAdjustFormQueries';
import type { QuantityAdjustFormState, QuantityAdjustFormStateSetters } from './useQuantityAdjustFormState';
import type { QuantityAdjustFormQueries } from './useQuantityAdjustFormQueries';

/**
 * Complete form interface combining state, queries, and form management.
 * 
 * @interface UseQuantityAdjustFormReturn
 * @extends QuantityAdjustFormState - Current state values
 * @extends QuantityAdjustFormStateSetters - State mutation functions
 * @extends QuantityAdjustFormQueries - Query results and data
 * @property {Control<QuantityAdjustForm>} control - react-hook-form control object
 * @property {UseFormStateReturn<QuantityAdjustForm>} formState - Form state (errors, dirty, etc.)
 * @property {UseFormSetValue<QuantityAdjustForm>} setValue - Update form field values
 * @property {() => void} onSubmit - Handle form submission
 * @property {() => void} handleClose - Handle dialog close with cleanup
 */
export interface UseQuantityAdjustFormReturn
  extends QuantityAdjustFormState,
    QuantityAdjustFormStateSetters,
    QuantityAdjustFormQueries {
  control: Control<QuantityAdjustForm>;
  formState: UseFormStateReturn<QuantityAdjustForm>;
  setValue: UseFormSetValue<QuantityAdjustForm>;
  onSubmit: () => void;
  handleClose: () => void;
}

/**
 * Thin orchestrator hook for quantity adjustment form.
 * 
 * Composes:
 * - State management (supplier, item, query, error)
 * - Query management (suppliers, items, details, price)
 * - Form management (validation, submission, error handling)
 * 
 * Provides unified interface combining all concerns:
 * - All state values and setters
 * - All query results
 * - Form control, state, and handlers
 * 
 * @param open - Whether dialog is open
 * @param onClose - Callback when dialog should close
 * @param onAdjusted - Callback when quantity is successfully adjusted
 * @param readOnly - Whether dialog is in demo/readonly mode
 * @returns Unified form interface combining all concerns
 * 
 * @example
 * ```ts
 * const form = useQuantityAdjustForm(open, onClose, onAdjusted);
 * return (
 *   <>
 *     <Supplier suppliers={form.suppliers} onSelect={form.setSelectedSupplier} />
 *     <Item items={form.items} onSelect={form.setSelectedItem} />
 *     <QuantityInput control={form.control} />
 *     <Button onClick={form.onSubmit}>Apply</Button>
 *   </>
 * );
 * ```
 */
export const useQuantityAdjustForm = (
  open: boolean,
  onClose: () => void,
  onAdjusted: () => void,
  readOnly = false
): UseQuantityAdjustFormReturn => {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();

  // ================================
  // Composition: State Management
  // ================================
  const state = useQuantityAdjustFormState();

  // ================================
  // Composition: Form Management
  // ================================
  const { control, handleSubmit, formState, reset, setValue } = useForm<QuantityAdjustForm>({
    resolver: zodResolver(quantityAdjustSchema),
    defaultValues: {
      itemId: '',
      newQuantity: 0,
      reason: 'MANUAL_UPDATE' as const,
    },
  });

  // ================================
  // Composition: Query Management
  // ================================
  const queries = useQuantityAdjustFormQueries(state, state, setValue, open);

  // ================================
  // Event Handlers
  // ================================

  /**
   * Handle dialog close with state cleanup.
   * Ensures clean state for next dialog open.
   * 
   * @enterprise
   * Prevents state pollution between dialog sessions.
   */
  const handleDialogClose = () => {
    state.setSelectedSupplier(null);
    state.setSelectedItem(null);
    state.setItemQuery('');
    state.setFormError('');
    reset();
    onClose();
  };

  /**
   * Handle form submission with quantity adjustment.
   * Validates input and applies quantity change with audit trail.
   * 
   * @enterprise
   * - Calculates quantity delta for backend compatibility
   * - Maintains audit trail through reason tracking
   * - Provides user feedback on operation success/failure
   * - Triggers parent component refresh for data consistency
   */
  const onSubmit = handleSubmit(async (values) => {
    if (!state.selectedItem) {
      state.setFormError(
        t('errors:inventory.selection.noItemSelected', 'Please select an item to adjust.')
      );
      return;
    }

    // Demo guard: allow exploration but block mutation
    if (readOnly) {
      state.setFormError(
        t('common.demoDisabled', 'You are in demo mode and cannot perform this operation.')
      );
      return;
    }

    state.setFormError('');

    try {
      // Use the actual current quantity from the fetched item details
      const actualCurrentQty = queries.effectiveCurrentQty;

      // Calculate the delta from the ACTUAL current quantity
      const delta = values.newQuantity - actualCurrentQty;

      const success = await adjustQuantity({
        id: values.itemId,
        delta,
        reason: values.reason,
      });

      if (success) {
        // Show success message with the new quantity
        toast(
          t('inventory:quantity.quantityUpdatedTo', 'Quantity changed to {{quantity}}', {
            quantity: values.newQuantity,
          }),
          'success'
        );
        onAdjusted();
        handleDialogClose();
      } else {
        state.setFormError(
          t(
            'errors.inventory.requests.failedToAdjustQuantity',
            'Failed to adjust quantity. Please try again.'
          )
        );
      }
    } catch (error) {
      console.error('Quantity adjustment error:', error);
      state.setFormError(
        t(
          'errors.inventory.requests.failedToAdjustQuantity',
          'Failed to adjust quantity. Please try again.'
        )
      );
    }
  });

  // ================================
  // Return Unified Interface
  // ================================

  return {
    // State values and setters
    ...state,
    // Query results
    ...queries,
    // Form management
    control,
    formState,
    setValue,
    onSubmit,
    handleClose: handleDialogClose,
  };
};
