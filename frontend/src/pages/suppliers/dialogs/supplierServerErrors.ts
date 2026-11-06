/**
 * @file supplierServerErrors.ts
 * @module pages/suppliers/dialogs/supplierServerErrors
 *
 * @summary
 * Classifies supplier mutation failures from the structured error envelope
 * ({error, message, timestamp, fieldErrors?}) that the backend emits, and
 * resolves them to translated, user-facing copy.
 *
 * @enterprise
 * - No substring matching on the server's free-text message: that breaks
 *   silently whenever the backend rewords a message, and cannot survive
 *   localisation of the server text at all.
 * - Classification keys on the status code and the status token (the `error`
 *   field, which is HttpStatus.name().toLowerCase()), never on message text.
 * - 409 is emitted for two distinct rules — a duplicate supplier name on
 *   create/update, and a supplier that items still reference (deleted items
 *   included) on delete. The two cannot occur on the same call, so the
 *   operation disambiguates them; that is why the caller passes its operation
 *   rather than the classifier guessing.
 * - fieldErrors is used as a signal (which input is at fault), not as copy:
 *   the server's text is English, and this application's display language is
 *   German. The translated key is rendered instead.
 */
import type { TFunction } from 'i18next';

/**
 * The subset of a mutation result this module classifies. Mirrors the fields
 * the API layer lifts out of the error envelope.
 */
export interface SupplierErrorEnvelope {
  errorToken?: string | null;
  status?: number | null;
  fieldErrors?: Record<string, string> | null;
}

/** The mutation that failed; disambiguates the two meanings of 409. */
export type SupplierOperation = 'add' | 'update' | 'delete';

export type SupplierT = TFunction<['common', 'suppliers', 'errors']>;

const FALLBACK_KEY = {
  add: 'errors:supplier.requests.failedToAddSupplier',
  update: 'errors:supplier.requests.failedToUpdateSupplier',
  delete: 'errors:supplier.requests.failedToDeleteSupplier',
} as const;

const isConflict = (e: SupplierErrorEnvelope): boolean =>
  e.status === 409 || e.errorToken === 'conflict';

const isForbidden = (e: SupplierErrorEnvelope): boolean =>
  e.status === 403 || e.errorToken === 'forbidden';

const isNotFound = (e: SupplierErrorEnvelope): boolean =>
  e.status === 404 || e.errorToken === 'not_found';

/**
 * True when the failure is a duplicate supplier name, which the caller can
 * attach directly to the name input.
 *
 * The fieldErrors check is the precise signal (the backend names the field,
 * DuplicateResourceException "name"); the status check covers a 409 that names
 * no field.
 */
export const isSupplierNameConflict = (e: SupplierErrorEnvelope): boolean =>
  Boolean(e.fieldErrors && typeof e.fieldErrors.name === 'string') || isConflict(e);

/**
 * Resolves a supplier mutation failure to translated form-level copy.
 */
export const supplierErrorMessage = (
  e: SupplierErrorEnvelope,
  t: SupplierT,
  operation: SupplierOperation
): string => {
  if (isForbidden(e)) {
    return t('errors:supplier.adminOnly');
  }
  if (isNotFound(e)) {
    return t('errors:supplier.businessRules.supplierNotFound');
  }
  if (isConflict(e)) {
    return operation === 'delete'
      ? t('errors:supplier.businessRules.cannotDeleteWithItems')
      : t('errors:supplier.businessRules.duplicateName');
  }
  return t(FALLBACK_KEY[operation]);
};
