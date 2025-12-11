/**
 * usePriceChangeForm - Orchestrator hook for price change workflow
 * 
 * @module dialogs/PriceChangeDialog/usePriceChangeForm
 * @description
 * Thin orchestrator composing:
 * - State management via usePriceChangeFormState
 * - Query management via usePriceChangeFormQueries
 * - Form validation via react-hook-form + Zod
 * - Error handling and submission
 * 
 * Returns unified interface for PriceChangeDialog component.
 */

import { useForm, type UseFormRegister, type UseFormSetError, type UseFormClearErrors, type UseFormHandleSubmit, type Control, type UseFormStateReturn, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast';
import { changePrice } from '../../../../api/inventory/mutations';
import { priceChangeSchema, type PriceChangeForm } from '../../../../api/inventory/validation';
import { usePriceChangeFormState, type PriceChangeFormState, type PriceChangeFormStateSetters } from './usePriceChangeFormState';
import { usePriceChangeFormQueries, type PriceChangeFormQueries } from './usePriceChangeFormQueries';

/**
 * Complete price change form state and handlers
 */
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

/**
 * Orchestrator hook composing state, queries, and form management
 * 
 * @param isOpen - Dialog open state
 * @param onClose - Close callback
 * @param onPriceChanged - Success callback
 * @param readOnly - Demo mode flag
 */
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
      } else {
        state.setFormError(
          t('errors:inventory.requests.failedToChangePrice', 'Failed to change price. Please try again.')
        );
      }
    } catch (error) {
      console.error('Price change error:', error);
      state.setFormError(
        t('errors:inventory.requests.failedToChangePrice', 'Failed to change price. Please try again.')
      );
    }
  });

  /**
   * Close dialog with complete state cleanup
   */
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
