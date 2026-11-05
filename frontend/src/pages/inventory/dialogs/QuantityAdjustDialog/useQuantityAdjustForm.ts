/**
 * @file useQuantityAdjustForm.ts
 * @module pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm
 *
 * @summary
 * Orchestrator hook for the quantity-adjust flow; owns the submit pipeline that computes
 * a delta and calls adjustQuantity.
 *
 * @enterprise
 * - Composes state, queries, and react-hook-form.
 * - Three-way composition same as PriceChangeDialog and
 *   DeleteItemDialog. Sub-hooks are independently exported.
 * - Submission pipeline:
 *     newQuantity - effectiveCurrentQty = delta
 *     adjustQuantity({ id, delta, reason }) -> ItemWriteResult
 *   Failures are mapped by backend errorToken: forbidden -> notAllowed,
 *   not_found -> itemNotFound, unprocessable_content (stale delta pushed
 *   stock negative) -> stockCannotGoNegative, else generic.
 *   The backend expects a delta, not an absolute. effectiveCurrentQty
 *   comes from the live itemDetailsQuery to avoid double-counting if
 *   the user holds the dialog open while the item changes elsewhere.
 * - quantityAdjustSchema constrains the reason to the direction-aware
 *   adjust set and rejects a zero-delta change; QuantityAdjustQuantityInput
 *   offers only the reasons valid for the current direction. The schema
 *   mirrors the backend StockHistoryValidator's accepted set.
 * - useQuantityAdjustFormQueries receives the combined state object
 *   (ItemSelectionState & ItemSelectionStateSetters) as a single parameter.
 */

import { useForm } from 'react-hook-form';
import type { Control, UseFormStateReturn, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast/ToastContext';
import { adjustQuantity } from '../../../../api/inventory/stockMutations';
import { quantityAdjustSchema, type QuantityAdjustForm } from '../../validation/inventoryValidation';
import { useQuantityAdjustFormQueries } from './useQuantityAdjustFormQueries';
import { useItemSelectionState, type ItemSelectionState, type ItemSelectionStateSetters } from '../useItemSelectionState';
import type { QuantityAdjustFormQueries } from './useQuantityAdjustFormQueries';
import { logError } from '../../../../utils/logger';

export interface UseQuantityAdjustFormReturn
  extends ItemSelectionState,
    ItemSelectionStateSetters,
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

  const state = useItemSelectionState();

  const { control, handleSubmit, formState, reset, setValue } = useForm<QuantityAdjustForm>({
    resolver: zodResolver(quantityAdjustSchema),
    defaultValues: {
      itemId: '',
      currentQuantity: 0,
      newQuantity: 0,
      reason: 'MANUAL_UPDATE' as const,
    },
  });

  const queries = useQuantityAdjustFormQueries(state, setValue, open);

  // Clears every value, so the next open starts empty
  const handleDialogClose = () => {
    state.setSelectedSupplier(null);
    state.setSelectedItem(null);
    state.setItemQuery('');
    state.setFormError('');
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!state.selectedItem) {
      state.setFormError(t('errors:inventory.selection.noItemSelected'));
      return;
    }

    // Demo guard: allow exploration but block mutation
    if (readOnly) {
      state.setFormError(
        t('common:demoDisabled')
      );
      return;
    }

    state.setFormError('');

    try {
      // The delta is taken from the fetched current quantity, not the search result's
      const actualCurrentQty = queries.effectiveCurrentQty;
      const delta = values.newQuantity - actualCurrentQty;

      const result = await adjustQuantity({
        id: values.itemId,
        delta,
        reason: values.reason,
      });

      if (result.ok) {
        toast(
          t('inventory:quantity.quantityUpdatedTo', {
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
      } else if (result.errorToken === 'unprocessable_content') {
        // Spring 7 names 422 UNPROCESSABLE_CONTENT (RFC 9110) and the backend sends the
        // lower-cased enum name, so the token is not the older 'unprocessable_entity'.
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

  return {
    ...state,
    ...queries,
    control,
    formState,
    setValue,
    onSubmit,
    handleClose: handleDialogClose,
  };
};
