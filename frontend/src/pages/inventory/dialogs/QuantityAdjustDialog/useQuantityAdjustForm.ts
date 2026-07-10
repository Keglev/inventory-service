/**
 * @file useQuantityAdjustForm.ts
 * @module pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm
 *
 * @summary
 * Orchestrator hook for the quantity-adjust flow. Composes state,
 * queries, and react-hook-form. Owns the submit pipeline that
 * computes a delta and calls adjustQuantity.
 *
 * @enterprise
 * - Three-way composition same as PriceChangeDialog and
 *   DeleteItemDialog. Sub-hooks are independently exported.
 * - Submission pipeline:
 *     newQuantity - actualCurrentQuantity = delta
 *     adjustQuantity({ id, delta, reason }) -> UpsertItemResponse
 *   Failures are mapped by backend errorToken: forbidden -> notAllowed,
 *   not_found -> itemNotFound, unprocessable_entity (stale delta pushed
 *   stock negative) -> stockCannotGoNegative, else generic.
 *   The backend expects a delta, not an absolute. actualCurrentQuantity
 *   comes from the live itemDetailsQuery to avoid double-counting if
 *   the user holds the dialog open while the item changes elsewhere.
 * - quantityAdjustSchema constrains the reason to the direction-aware
 *   adjust set and rejects a zero-delta change; QuantityAdjustQuantityInput
 *   offers only the reasons valid for the current direction. The schema
 *   mirrors the backend StockHistoryValidator's accepted set.
 * - useQuantityAdjustFormQueries receives the combined state object
 *   (QuantityAdjustFormState & QuantityAdjustFormStateSetters) as a
 *   single parameter, eliminating the prior two-slot ambiguity.
 */

import { useForm } from 'react-hook-form';
import type { Control, UseFormStateReturn, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast/ToastContext';
import { adjustQuantity } from '../../../../api/inventory/stockMutations';
import { quantityAdjustSchema, type QuantityAdjustForm } from '../../validation/inventoryValidation';
import { useQuantityAdjustFormState } from './useQuantityAdjustFormState';
import { useQuantityAdjustFormQueries } from './useQuantityAdjustFormQueries';
import type { QuantityAdjustFormState, QuantityAdjustFormStateSetters } from './useQuantityAdjustFormState';
import type { QuantityAdjustFormQueries } from './useQuantityAdjustFormQueries';
import { logError } from '../../../../utils/logger';

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
      currentQuantity: 0,
      newQuantity: 0,
      reason: 'MANUAL_UPDATE' as const,
    },
  });

  // ================================
  // Composition: Query Management
  // ================================
  const queries = useQuantityAdjustFormQueries(state, setValue, open);

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
      state.setFormError(t('errors:inventory.selection.noItemSelected'));
      return;
    }

    // Demo guard: allow exploration but block mutation
    if (readOnly) {
      state.setFormError(
        t('common:demoDisabled', 'You are in demo mode and cannot perform this operation.')
      );
      return;
    }

    state.setFormError('');

    try {
      // Use the actual current quantity from the fetched item details
      const actualCurrentQty = queries.effectiveCurrentQty;

      // Calculate the delta from the ACTUAL current quantity
      const delta = values.newQuantity - actualCurrentQty;

      const result = await adjustQuantity({
        id: values.itemId,
        delta,
        reason: values.reason,
      });

      if (result.ok) {
        // Show success message with the new quantity
        toast(
          t('inventory:quantity.quantityUpdatedTo', 'Quantity changed to {{quantity}}', {
            quantity: values.newQuantity,
          }),
          'success'
        );
        onAdjusted();
        handleDialogClose();
      } else if (result.errorToken === 'forbidden') {
        state.setFormError(t('errors:inventory.businessRules.notAllowed'));
      } else if (result.errorToken === 'not_found') {
        state.setFormError(t('errors:inventory.businessRules.itemNotFound'));
      } else if (result.errorToken === 'unprocessable_entity') {
        state.setFormError(t('errors:inventory.businessRules.stockCannotGoNegative'));
      } else {
        state.setFormError(t('errors:inventory.requests.failedToAdjustQuantity'));
      }
    } catch (error) {
      logError('Quantity adjustment error:', error);
      state.setFormError(
        t('errors:inventory.requests.failedToAdjustQuantity')
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
