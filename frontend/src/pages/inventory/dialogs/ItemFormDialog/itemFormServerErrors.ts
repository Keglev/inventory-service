/**
 * @file itemFormServerErrors.ts
 * @module pages/inventory/dialogs/ItemFormDialog/itemFormServerErrors
 * @summary Maps failed upsert responses onto react-hook-form field and form-level errors.
 * @enterprise
 * Extracted from useItemForm so the server-error-to-form translation is a
 * separate responsibility from form orchestration. Prefers the backend's
 * structured fieldErrors map (backend 'sku' maps to the form's 'code' field);
 * falls back to token-based mapping ('conflict' highlights the name field)
 * for errors without field attribution, and to a form-level message
 * otherwise. Callbacks are injected so the module stays free of hook state.
 */
import type { UseFormSetError } from 'react-hook-form';
import type { TFunction } from 'i18next';
import type { UpsertItemForm } from '../../validation/inventoryValidation';

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

export type ItemFormServerErrorDeps = {
  setError: UseFormSetError<UpsertItemForm>;
  setFormError: (message: string) => void;
  t: TFunction<['common', 'inventory', 'errors']>;
};

export function applyItemFormServerError(
  result: { errorToken?: string | null; fieldErrors?: Record<string, string> | null },
  { setError, setFormError, t }: ItemFormServerErrorDeps
): void {
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
    setError('name', { message: 'errors:inventory.conflicts.duplicateName' });
    return;
  }

  setFormError(t('errors:inventory.server.serverError'));
}
