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
 *     adjustQuantity({ id, delta, reason })
 *   The backend expects a delta, not an absolute. actualCurrentQuantity
 *   comes from the live itemDetailsQuery to avoid double-counting if
 *   the user holds the dialog open while the item changes elsewhere.
 * - quantityAdjustSchema uses z.string().min(1) for the reason -- the
 *   primary site of CB-E. The frontend offers all 11
 *   StockChangeReason values via QuantityAdjustQuantityInput's
 *   STOCK_CHANGE_REASONS list (CB-APP60); the backend
 *   StockHistoryValidator is the only real authority.
 * - Two t() calls use dot instead of colon as the namespace
 *   separator: 'common.demoDisabled' and
 *   'errors.inventory.requests.failedToAdjustQuantity' (x2).
 *   They silently fall back to the English literal and miss the
 *   resource. Same class as CM-APP10 in DeleteItemDialog.
 *   Tracked under CB-APP61 alongside the unguarded console.error
 *   in this file.
 * - useQuantityAdjustFormQueries is called with the state object
 *   passed BOTH as the state arg and the setters arg. The setters
 *   come through because the hook return spreads both, but the
 *   signature reads ambiguously. Tracked under ST-APP16.
 * - console.error on submission failure is unguarded and ships to
 *   production browser devtools. Tracked under CB-APP61.
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
      newQuantity: 0,
      reason: 'MANUAL_UPDATE' as const,
    },
  });

  // ================================
  // Composition: Query Management
  // ================================
  // BUCKET: ST-APP16 -- state passed as both state and setters args. The state hook returns both shapes so the call works, but the signature is ambiguous. Pass them as distinct objects in refactor.
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
        // BUCKET: CB-APP61 -- namespace uses '.' instead of ':'. Should be t('common:demoDisabled', ...).
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
          // BUCKET: CB-APP61 -- namespace uses '.' instead of ':'. Should be t('errors:inventory.requests.failedToAdjustQuantity', ...).
          t(
            'errors.inventory.requests.failedToAdjustQuantity',
            'Failed to adjust quantity. Please try again.'
          )
        );
      }
    } catch (error) {
      // BUCKET: CB-APP61 -- unguarded console.error ships to production devtools.
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
