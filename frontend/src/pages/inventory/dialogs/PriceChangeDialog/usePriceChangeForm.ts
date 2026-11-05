/**
 * @file usePriceChangeForm.ts
 * @module pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm
 *
 * @summary
 * Orchestrator hook for the price-change flow; owns the submit pipeline that calls changePrice.
 *
 * @enterprise
 * - Composes useItemSelectionState, usePriceChangeFormQueries and a react-hook-form instance.
 * - Three-way composition same as DeleteItemDialog. State and queries
 *   are exported individually; the orchestrator is the consumer-facing
 *   entry.
 * - priceChangeSchema validates itemId and newPrice (must be > 0).
 *   No reason field -- the backend records the change as PRICE_CHANGE
 *   itself. Different from itemFormSchema (create) and
 *   quantityAdjustSchema (adjust).
 * - Failures are classified by the backend status token: 'forbidden' ->
 *   admin-only, 'not_found' -> item no longer exists, anything else ->
 *   a generic "failed to change price" message. This keys on the
 *   structured error shape, never on substrings of the message, matching
 *   the delete/rename/create flows.
 */

import { useForm, type Control, type UseFormStateReturn, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast/ToastContext';
import { changePrice } from '../../../../api/inventory/priceMutations';
import { priceChangeSchema, type PriceChangeForm } from '../../validation/inventoryValidation';
import { useItemSelectionState, type ItemSelectionState, type ItemSelectionStateSetters } from '../useItemSelectionState';
import { usePriceChangeFormQueries, type PriceChangeFormQueries } from './usePriceChangeFormQueries';
import { logError } from '../../../../utils/logger';

export interface UsePriceChangeFormReturn extends ItemSelectionState, ItemSelectionStateSetters, PriceChangeFormQueries {
  control: Control<PriceChangeForm>;
  formState: UseFormStateReturn<PriceChangeForm>;
  setValue: UseFormSetValue<PriceChangeForm>;
  onSubmit: () => Promise<void>;
  handleClose: () => void;
}

export function usePriceChangeForm({
  isOpen,
  onClose,
  onPriceChanged = () => {},
  readOnly = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPriceChanged?: () => void;
  readOnly?: boolean;
}): UsePriceChangeFormReturn {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();

  const state = useItemSelectionState();

  const {
    control,
    handleSubmit: rhfHandleSubmit,
    formState,
    reset,
    setValue,
    clearErrors,
  } = useForm<PriceChangeForm>({
    resolver: zodResolver(priceChangeSchema),
    defaultValues: {
      itemId: '',
      newPrice: 0,
    },
  });

  const queries = usePriceChangeFormQueries(
    isOpen,
    state.selectedSupplier,
    state.itemQuery,
    state.selectedItem,
    setValue,
    clearErrors
  );

  const handleClose = () => {
    state.setSelectedSupplier(null);
    state.setSelectedItem(null);
    state.setItemQuery('');
    state.setFormError('');
    reset();
    onClose();
  };

  /**
   * Submit form with price change
   */
  const onSubmit = rhfHandleSubmit(async (values: PriceChangeForm) => {
    if (!state.selectedItem) {
      state.setFormError(t('errors:inventory.selection.noItemSelected'));
      return;
    }

    if (readOnly) {
      state.setFormError(t('common:demoDisabled'));
      return;
    }

    state.setFormError('');
    clearErrors();

    try {
      const success = await changePrice({
        id: values.itemId,
        price: values.newPrice,
      });

      if (success.ok) {
        toast(
          t('inventory:price.priceUpdatedTo', {
            price: values.newPrice.toFixed(2),
          }),
          'success'
        );
        onPriceChanged();
        handleClose();
      } else if (success.errorToken === 'forbidden') {
        state.setFormError(t('errors:inventory.businessRules.adminOnly'));
      } else if (success.errorToken === 'not_found') {
        state.setFormError(t('errors:inventory.businessRules.itemNotFound'));
      } else {
        state.setFormError(t('errors:inventory.requests.failedToChangePrice'));
      }
    } catch (error) {
      logError('Price change error:', error);
      state.setFormError(t('errors:inventory.requests.failedToChangePrice'));
    }
  });

  return {
    ...state,
    ...queries,
    control,
    formState,
    setValue,
    onSubmit,
    handleClose,
  };
}
