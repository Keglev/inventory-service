/**
 * @file itemFormServerErrors.ts
 * @module pages/inventory/dialogs/ItemFormDialog/itemFormServerErrors
 * @summary Maps failed upsert responses onto react-hook-form field and form-level errors.
 * @enterprise
 * Extracted from useItemForm so the server-error-to-form translation is a
 * separate responsibility from form orchestration. Callbacks are injected so
 * the module stays free of hook state.
 *
 * The backend's `fieldErrors` map is read as a SIGNAL — it says WHICH input the
 * server rejected — and never as copy. Its text is English and the display
 * language is German, so the message is deliberately discarded and a translated
 * key is attached instead. This mirrors the supplier classifier; the two domains
 * now behave alike.
 *
 * Which key a field earns depends on the error token, because the two producers
 * of `fieldErrors` mean different things:
 *   - `conflict` (409) is raised by an explicit duplicate check, so the offending
 *     field is known precisely: name (a duplicate is name AND price together) or
 *     sku.
 *   - anything else (in practice 400 bean validation) reports only that a rule
 *     fired, not which one. The server does not name the constraint, so guessing
 *     a specific sentence would be inventing a contract; the field is flagged
 *     with a neutral key instead. Zod catches nearly all of these client-side
 *     first, so this path is a backstop.
 * Fields absent from SERVER_TO_FORM_FIELD cannot be attached to an input and
 * fall through to the form-level message.
 */
import type { UseFormSetError } from 'react-hook-form';
import type { TFunction } from 'i18next';
import type { UpsertItemForm } from '../../validation/inventoryValidation';
import type { FieldErrorKey } from '../../../../utils/fieldErrorText';

/**
 * Backend field name to form field name. The backend calls the item code
 * 'sku'; the form (and grid) call it 'code'.
 */
const SERVER_TO_FORM_FIELD: Record<string, keyof UpsertItemForm> = {
  sku: 'code',
  name: 'name',
  quantity: 'quantity',
  price: 'price',
  supplierId: 'supplierId',
};

/** The only two fields a 409 can attribute (InventoryItemLookupValidator). */
const CONFLICT_KEY_BY_SERVER_FIELD: Record<string, FieldErrorKey> = {
  name: 'errors:inventory.conflicts.duplicateName',
  sku: 'errors:inventory.conflicts.duplicateSku',
};

/** Resolves the key to attach to an input the server rejected. */
function fieldErrorKey(errorToken: string | null | undefined, serverField: string): FieldErrorKey {
  if (errorToken === 'conflict') {
    const conflict = CONFLICT_KEY_BY_SERVER_FIELD[serverField];
    if (conflict) return conflict;
  }
  return 'errors:validation.invalid';
}

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
    // The server's message is intentionally not read: only the field name is.
    for (const serverField of Object.keys(result.fieldErrors)) {
      const formField = SERVER_TO_FORM_FIELD[serverField];
      if (formField) {
        setError(formField, { message: fieldErrorKey(result.errorToken, serverField) });
        applied = true;
      }
    }
    if (applied) {
      setFormError(t('errors:form.validationFailed'));
      return;
    }
  }

  if (result.errorToken === 'conflict') {
    setError('name', { message: 'errors:inventory.conflicts.duplicateName' });
    setFormError(t('errors:form.validationFailed'));
    return;
  }

  setFormError(t('errors:inventory.server.serverError'));
}
