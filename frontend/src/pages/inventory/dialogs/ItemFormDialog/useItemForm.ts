/**
 * @file useItemForm.ts
 * @module pages/inventory/dialogs/ItemFormDialog/useItemForm
 *
 * @summary
 * Orchestrator hook for the create-or-edit item flow. Owns the
 * react-hook-form instance, the suppliers query, two sync effects, and
 * the submit pipeline (validate, map to UpsertItemRequest, call
 * upsertItem, map errors).
 *
 * @enterprise
 * - itemFormSchema constrains reason to the 2-value subset
 *   INITIAL_STOCK | MANUAL_UPDATE. The backend enforces the same subset
 *   for create/upsert. The locked 11-value StockChangeReason enum covers
 *   removals and other flows that do not belong on creation. CM-3
 *   closure: subset is intentional and backend-authoritative.
 * - Two effects keep state coherent. The supplier-alignment effect
 *   addresses a real race: defaultValues are set before suppliers
 *   load, so the controlled Autocomplete needs to be re-aligned to
 *   the loaded SupplierOption once the list arrives. The reset-on-open
 *   effect guarantees a clean state on every open, so a previous edit
 *   session does not leak into a new create.
 * - Submit pipeline maps form values to UpsertItemRequest:
 *   reason -> notes (backend stores the reason as the StockHistory
 *   notes column for this flow), and minQty defaults to DEFAULT_MIN_QUANTITY.
 *   The minQty value is the same low-stock baseline that drives
 *   LowStockTable's critical chip and useInventoryRowStyling.
 * - createdBy is intentionally not sent. The backend always sets it
 *   from the authenticated session (server-authoritative audit field),
 *   so any client value is ignored; sending a placeholder was
 *   misleading and has been removed.
 * - applyServerError keys on the backend status token (errorToken), not
 *   freeform message text, matching deleteItemErrorHandler (CB-APP48)
 *   and useEditItemForm (CB-APP50).
 * - Demo mode (readOnly) short-circuits before the mutation so a demo
 *   user sees the same disabled-action message regardless of validation
 *   state.
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
import { useSuppliersQuery } from '../../../../api/inventory/hooks';
import { DEFAULT_MIN_QUANTITY } from '../../../../config/inventoryPolicy';

/**
 * Backend field name to form field name. The backend calls the item code
 * 'sku'; the form (and grid) call it 'code'. Fields absent from this map
 * cannot be attached to an input and fall back to the form-level message.
 */
const SERVER_TO_FORM_FIELD: Record<string, keyof UpsertItemForm> = {
  sku: 'code',
  name: 'name',
  quantity: 'quantity',
  price: 'price',
  supplierId: 'supplierId',
};

/**
 * Complete item form state and handlers
 * 

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
   * Convert a failed upsert response into field or form errors.
   *
   * Prefers the backend's structured fieldErrors map: every entry that maps
   * to a known form field becomes a react-hook-form field error (backend
   * 'sku' maps to the form's 'code' field). Falls back to token-based
   * mapping ('conflict' highlights the name field) for errors without field
   * attribution, and to a form-level message otherwise.
   */
  function applyServerError(result: {
    errorToken?: string | null;
    fieldErrors?: Record<string, string> | null;
  }): void {
    if (result.fieldErrors) {
      let applied = false;
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        const formField = SERVER_TO_FORM_FIELD[field];
        if (formField) {
          setError(formField, { message });
          applied = true;
        }
      }
      if (applied) return;
    }

    if (result.errorToken === 'conflict') {
      setError('name', {
        message: t('errors:inventory.conflicts.duplicateName'),
      });
      return;
    }

    setFormError(t('errors:inventory.server.serverError'));
  }

  /**
   * Submit form with validation and API call
   * 
   * @enterprise
   * - Honors readOnly (demo mode) flag
   * - Maps form values to UpsertItemRequest (reason -> notes, onHand -> quantity)
   * - Auto-sets minQty to DEFAULT_MIN_QUANTITY
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
      sku: values.code,
      supplierId: values.supplierId,
      quantity: values.quantity,
      price: values.price,
      minQty: DEFAULT_MIN_QUANTITY,
      notes: values.reason,
    };

    const res = await upsertItem(requestData);
    if (res.ok) {
      toast(t('inventory:status.itemSaved', 'Item saved successfully!'), 'success');
      onSaved();
      handleClose();
    } else {
      applyServerError(res);
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
