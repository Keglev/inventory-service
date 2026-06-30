/**
 * @file usePriceChangeForm.ts
 * @module pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm
 *
 * @summary
 * Orchestrator hook for the price-change flow. Composes
 * usePriceChangeFormState, usePriceChangeFormQueries, and a react-hook-form
 * instance. Owns the submit pipeline that calls changePrice.
 *
 * @enterprise
 * - Three-way composition same as DeleteItemDialog. State and queries
 *   are exported individually; the orchestrator is the consumer-facing
 *   entry.
 * - priceChangeSchema validates itemId and newPrice (must be > 0).
 *   No reason field -- backend does not record a reason for price
 *   changes. Different from itemFormSchema (create) and
 *   quantityAdjustSchema (adjust). CB-E asymmetry does not surface
 *   here.
 * - No substring error-mapping. On failure, the user sees a generic
 *   "failed to change price" message regardless of cause (admin-only,
 *   validation, conflict). Tracked under CB-APP56 -- consider aligning
 *   with the delete/rename/create flows once the structured-error
 *   refactor (CB-APP48/50/52 sibling cluster) lands.
 * - console.error on submission failure is unguarded and ships to
 *   production browser devtools. Tracked under CB-APP55 (same class
 *   as CB-APP47, CB-APP51, etc.).
 * - handleClose is referenced inside onSubmit but declared after it.
 *   The file works due to closure semantics but reads confusingly.
 *   Tracked under ST-APP17.
 */

import { useForm, type UseFormRegister, type UseFormSetError, type UseFormClearErrors, type UseFormHandleSubmit, type Control, type UseFormStateReturn, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast';
import { changePrice } from '../../../../api/inventory/mutations';
import { priceChangeSchema, type PriceChangeForm } from '../../../../api/inventory/validation';
import { usePriceChangeFormState, type PriceChangeFormState, type PriceChangeFormStateSetters } from './usePriceChangeFormState';
import { usePriceChangeFormQueries, type PriceChangeFormQueries } from './usePriceChangeFormQueries';

export interface UsePriceChangeFormReturn extends PriceChangeFormState, PriceChangeFormStateSetters, PriceChangeFormQueries {
  register: UseFormRegister<PriceChangeForm>;
  control: Control<PriceChangeForm>;
  formState: UseFormStateReturn<PriceChangeForm>;
  setValue: UseFormSetValue<PriceChangeForm>;
  setError: UseFormSetError<PriceChangeForm>;
  clearErrors: UseFormClearErrors<PriceChangeForm>;
  handleSubmit: UseFormHandleSubmit<PriceChangeForm>;
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

  // Compose state management
  const state = usePriceChangeFormState();

  // Form management
  const {
    register,
    control,
    handleSubmit: rhfHandleSubmit,
    formState,
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<PriceChangeForm>({
    resolver: zodResolver(priceChangeSchema),
    defaultValues: {
      itemId: '',
      newPrice: 0,
    },
  });

  // Compose query management with form effects
  const queries = usePriceChangeFormQueries(
    isOpen,
    state.selectedSupplier,
    state.itemQuery,
    state.selectedItem,
    setValue,
    clearErrors
  );

  /**
   * Submit form with price change
   */
  const onSubmit = rhfHandleSubmit(async (values: PriceChangeForm) => {
    if (!state.selectedItem) {
      state.setFormError(
        t('errors:inventory.selection.noItemSelected', 'Please select an item to change price.')
      );
      return;
    }

    if (readOnly) {
      state.setFormError(t('common:demoDisabled', 'This action is disabled in demo mode.'));
      return;
    }

    state.setFormError(null);
    clearErrors();

    try {
      const success = await changePrice({
        id: values.itemId,
        price: values.newPrice,
      });

      if (success) {
        toast(
          t('inventory:price.priceUpdatedTo', 'Price changed to {{price}}', {
            price: values.newPrice.toFixed(2),
          }),
          'success'
        );
        onPriceChanged();
        handleClose();
      // BUCKET: CB-APP56 -- generic fallback message regardless of cause. Align with delete/rename/create structured error mapping in refactor.
      } else {
        state.setFormError(
          t('errors:inventory.requests.failedToChangePrice', 'Failed to change price. Please try again.')
        );
      }
    } catch (error) {
      // BUCKET: CB-APP55 -- unguarded console.error ships to production devtools.
      console.error('Price change error:', error);
      state.setFormError(
        t('errors:inventory.requests.failedToChangePrice', 'Failed to change price. Please try again.')
      );
    }
  });

  // BUCKET: ST-APP17 -- declared after onSubmit which references it. Move above onSubmit in refactor for readability.
  const handleClose = () => {
    state.setSelectedSupplier(null);
    state.setSelectedItem(null);
    state.setItemQuery('');
    state.setFormError(null);
    reset();
    onClose();
  };

  return {
    // State
    ...state,
    // Queries
    ...queries,
    // Form
    register,
    control,
    formState,
    setValue,
    setError,
    clearErrors,
    handleSubmit: rhfHandleSubmit,
    // Handlers
    onSubmit,
    handleClose,
  };
}
