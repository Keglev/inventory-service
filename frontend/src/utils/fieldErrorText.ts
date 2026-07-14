/**
 * @file fieldErrorText.ts
 * @module utils/fieldErrorText
 *
 * @summary
 * Resolves a react-hook-form field error to translated helper text.
 *
 * @enterprise
 * - Establishes one invariant for the whole application: the `message` carried
 *   on a react-hook-form field error is always an i18n KEY, never display text.
 *   Validation schemas are pure data and must not depend on a translator, so
 *   the key is resolved here — at the one boundary that already holds a `t`.
 * - Both channels that populate a field error feed through this helper: a
 *   client-side Zod rejection, and a server-side field attribution lifted out
 *   of the structured error envelope. A German user must read the same sentence
 *   whichever side rejected the input.
 * - FieldErrorKey is a CLOSED set by design. react-hook-form types `message` as
 *   a bare `string`, which would force the translator parameter to accept any
 *   string — and a typed i18next `TFunction` is not assignable to that, because
 *   it only accepts keys it can prove exist. Naming the permitted keys makes the
 *   call sites type-check without weakening key typing anywhere else, and keeps
 *   an auditable list of what may travel on a field error.
 * - Returns an empty string rather than undefined so a MUI TextField keeps a
 *   stable helper row instead of collapsing it as the user types.
 */
import type { FieldError } from 'react-hook-form';

/**
 * Every i18n key permitted to travel on a field error.
 *
 * The shared constraint failures come from the Zod schemas; the two conflict
 * keys are attached by a server-error classifier when the backend attributes a
 * 409 to a specific input. Extend this union when a new field-level key appears.
 */
export type FieldErrorKey =
  | 'errors:validation.required'
  | 'errors:validation.invalidEmail'
  | 'errors:validation.nonNegative'
  | 'errors:validation.positive'
  | 'errors:validation.quantityUnchanged'
  | 'errors:validation.reasonInvalidForIncrease'
  | 'errors:validation.reasonInvalidForDecrease'
  | 'errors:validation.invalid'
  | 'errors:inventory.conflicts.duplicateName'
  | 'errors:inventory.conflicts.duplicateSku'
  | 'errors:supplier.businessRules.duplicateName';

/**
 * The only capability this module needs from a translator. Any `t` whose
 * namespaces include `errors` satisfies it.
 */
export type FieldErrorTranslator = (key: FieldErrorKey) => string;

/**
 * Translates the i18n key held on a field error.
 *
 * @param error the field error react-hook-form exposes for the input, if any
 * @param t     a translator whose namespaces include `errors`
 * @returns translated helper text, or an empty string when the field is valid
 */
export const fieldErrorText = (
  error: FieldError | undefined,
  t: FieldErrorTranslator
): string => {
  const key = error?.message;
  if (typeof key !== 'string' || key.length === 0) return '';
  // The invariant above is what makes this cast sound: react-hook-form cannot
  // express it, so it is asserted here once instead of at every call site.
  return t(key as FieldErrorKey);
};
