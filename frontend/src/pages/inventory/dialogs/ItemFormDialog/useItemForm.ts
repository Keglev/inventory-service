/**
 * useItemForm - Orchestrator hook for create/edit item workflow
 * 
 * @module dialogs/ItemFormDialog/useItemForm
 * @description
 * Manages all state, queries, and form handling for item creation/editing:
 * supplier selection → item details → validation → API submission.
 * 
 * Composes three specialized concerns:
 * - State: supplier, form values, errors, controlled Autocomplete value
 * - Queries: suppliers with 5-minute cache via useSuppliersQuery
 * - Handlers: form submission with error mapping and demo mode support
 */

import * as React from 'react';
import { useForm, type Control, type UseFormStateReturn, type UseFormSetValue, type UseFormRegister, type UseFormSetError, type UseFormClearErrors, type UseFormWatch, type UseFormHandleSubmit } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast';
import { upsertItem } from '../../../../api/inventory/mutations';
import { itemFormSchema, type UpsertItemForm } from '../../../../api/inventory/validation';
import type { UpsertItemRequest, InventoryRow } from '../../../../api/inventory';
import type { SupplierOption } from '../../../../api/analytics/types';
import { useSuppliersQuery } from '../../../../api/inventory/hooks/useInventoryData';

/**
 * Complete item form state and handlers
 * 
 * @interface UseItemFormReturn
 */
export interface UseItemFormReturn {
  // State
  supplierValue: SupplierOption | null;
  formError: string | null;

  // Setters
  setSupplierValue: (supplier: SupplierOption | null) => void;
  setFormError: (error: string | null) => void;

  // Query
  suppliers: SupplierOption[];

  // Form methods
  register: UseFormRegister<UpsertItemForm>;
  control: Control<UpsertItemForm>;
  formState: UseFormStateReturn<UpsertItemForm>;
  setValue: UseFormSetValue<UpsertItemForm>;
  setError: UseFormSetError<UpsertItemForm>;
  clearErrors: UseFormClearErrors<UpsertItemForm>;
  watch: UseFormWatch<UpsertItemForm>;
  handleSubmit: UseFormHandleSubmit<UpsertItemForm>;

  // Handlers
  onSubmit: () => Promise<void>;
  handleClose: () => void;
}

/**
 * Orchestrator hook managing item form workflow
 * 
 * @param params.isOpen - Whether dialog is currently open (controls query firing)
 * @param params.initial - Initial item data for edit mode (undefined for create)
 * @param params.onClose - Callback when dialog closes
 * @param params.onSaved - Optional callback after successful save
 * @param params.readOnly - Demo mode flag (disables submission)
 * @returns Complete form state and handlers
 * 
 * @enterprise
 * - Smart supplier loading with 5-minute cache via useSuppliersQuery
 * - Controlled Autocomplete to prevent UI/RHF desync
 * - Intelligent error mapping: detects duplicate name/code and fields supplier issues
 * - Form state resets on dialog open to ensure clean state
 * - Supplier alignment effect handles race conditions when list loads late
 */
export function useItemForm({
  isOpen,
  initial,
  onClose,
  onSaved = () => {},
  readOnly = false,
}: {
  isOpen: boolean;
  initial?: InventoryRow | null;
  onClose: () => void;
  onSaved?: () => void;
  readOnly?: boolean;
}): UseItemFormReturn {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();

  // ================================
  // State Management
  // ================================

  const [supplierValue, setSupplierValue] = React.useState<SupplierOption | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  // ================================
  // Data Query
  // ================================

  const { data: suppliers = [] } = useSuppliersQuery(isOpen);

  // ================================
  // Form Management
  // ================================

  const {
    register,
    control,
    handleSubmit: rhfHandleSubmit,
    formState,
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
  } = useForm<UpsertItemForm>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      supplierId: initial?.supplierId ?? '',
      quantity: initial?.onHand ?? 0,
      price: 0,
      reason: 'INITIAL_STOCK',
    },
  });

  // ================================
  // Effects
  // ================================

  /**
   * Align controlled Autocomplete with initial supplierId when suppliers load
   * Prevents race condition where suppliers arrive after defaultValues set
   */
  React.useEffect(() => {
    if (!suppliers.length) return;
    const match = suppliers.find((s) => String(s.id) === String(initial?.supplierId)) ?? null;
    setSupplierValue(match);
  }, [suppliers, initial?.supplierId]);

  /**
   * Reset form state when dialog opens with different initial data
   * Ensures predictable state for Create vs Edit flows
   */
  React.useEffect(() => {
    if (!isOpen) return;
    reset({
      name: initial?.name ?? '',
      code: initial?.code ?? '',
      supplierId: (initial?.supplierId as UpsertItemForm['supplierId']) ?? '',
      quantity: initial?.onHand ?? 0,
      price: 0,
      reason: 'INITIAL_STOCK',
    });
    setFormError(null);
    clearErrors();
  }, [isOpen, initial, reset, clearErrors]);

  // ================================
  // Handlers
  // ================================

  /**
   * Convert generic backend error string into field or form errors
   * Uses readable heuristics (duplicate name/code, supplier issues)
   * Can be replaced by structured fieldErrors in future
   */
  function applyServerError(message?: string | null): void {
    if (!message) return;
    const msg = message.toLowerCase();

    // Heuristics for duplicates
    if (msg.includes('name') && (msg.includes('duplicate') || msg.includes('exists'))) {
      setError('name', {
        message: t('errors:inventory.conflicts.duplicateName', 'An item with this name already exists.'),
      });
      setFormError(t('errors:inventory.validationFailed', 'Please fix the highlighted fields.'));
      return;
    }
    if ((msg.includes('code') || msg.includes('sku')) && (msg.includes('duplicate') || msg.includes('exists'))) {
      setError('code', {
        message: t('errors:inventory.conflicts.duplicateCode', 'An item with this code already exists.'),
      });
      setFormError(t('errors:inventory.validationFailed', 'Please fix the highlighted fields.'));
      return;
    }
    if (msg.includes('supplier')) {
      setError('supplierId', { message });
      setFormError(t('errors:inventory.validationFailed', 'Please fix the highlighted fields.'));
      return;
    }

    // Generic fallback
    setFormError(message || t('errors:inventory.server.serverError', 'Something went wrong. Please try again.'));
  }

  /**
   * Submit form with validation and API call
   * 
   * @enterprise
   * - Honors readOnly (demo mode) flag
   * - Maps form values to UpsertItemRequest (reason → notes, onHand → quantity)
   * - Auto-sets minQty to 5 and createdBy to 'user'
   * - Maps field-level and generic errors from backend
   * - Triggers onSaved callback and closes on success
   */
  const onSubmit = rhfHandleSubmit(async (values: UpsertItemForm) => {
    setFormError(null);
    clearErrors();

    // Demo guard
    if (readOnly) {
      setFormError(t('common:demoDisabled', 'This action is disabled in demo mode.'));
      return;
    }

    // Map form values to backend request shape
    const requestData: UpsertItemRequest = {
      name: values.name,
      code: values.code,
      supplierId: values.supplierId,
      quantity: values.quantity,
      price: values.price,
      minQty: 5,
      notes: values.reason,
      createdBy: 'user',
    };

    const res = await upsertItem(requestData);
    if (res.ok) {
      toast(t('inventory:status.itemSaved', 'Item saved successfully!'), 'success');
      onSaved();
      handleClose();
    } else {
      applyServerError(res.error ?? t('errors:inventory.server.serverError', 'Something went wrong. Please try again.'));
    }
  });

  /**
   * Close dialog with complete state cleanup
   * Prevents state pollution between sessions
   */
  const handleClose = () => {
    setSupplierValue(null);
    setFormError(null);
    reset();
    onClose();
  };

  return {
    supplierValue,
    formError,
    setSupplierValue,
    setFormError,
    suppliers,
    register,
    control,
    formState,
    setValue,
    setError,
    clearErrors,
    watch,
    handleSubmit: rhfHandleSubmit,
    onSubmit,
    handleClose,
  };
}
