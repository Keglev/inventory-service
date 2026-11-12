/**
 * @file validation.ts
 * @module api/suppliers/validation
 *
 * @summary
 * Zod schemas for the supplier create and edit forms.
 *
 * @enterprise
 * - Every message is an i18n KEY, never display text; utils/fieldErrorText resolves it
 *   at the render boundary, so client and server rejections of a field read identically.
 * - Email is validated client-side to match the backend's `@Email` constraint; other fields have no format rules.
 * - Optional string fields transform empty strings to null so the backend receives a clean null, not "".
 */

import { z } from 'zod';

/**
 * Optional e-mail of both supplier forms: an empty field (the forms' default '')
 * means no address and becomes null; anything else must be a valid address, so
 * a typo shows the field error instead of being dropped.
 */
const optionalEmail = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.email('errors:validation.invalidEmail').nullable(),
);

/**
 * Schema for the supplier create form.
 * Empty optional fields are coerced to null so the backend receives null rather than an empty string.
 */
export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'errors:validation.required')
    .trim(),
  contactName: z
    .string()
    .optional()
    .transform((v) => v || null),
  phone: z
    .string()
    .optional()
    .transform((v) => v || null),
  email: optionalEmail,
});

export type CreateSupplierForm = z.infer<typeof createSupplierSchema>;

/**
 * Schema for the supplier edit form.
 * Excludes `name` — renaming is not exposed through this form.
 *
 * @remarks
 * The backend PUT does accept name changes (with a uniqueness check via SupplierValidator.assertUniqueName),
 * so omitting name here is a frontend form decision, not a backend immutability rule.
 */
export const editSupplierSchema = z.object({
  supplierId: z.string().min(1, 'errors:validation.required'),
  contactName: z.string().nullable().catch(null),
  phone: z.string().nullable().catch(null),
  email: optionalEmail,
});

export type EditSupplierForm = z.infer<typeof editSupplierSchema>;
