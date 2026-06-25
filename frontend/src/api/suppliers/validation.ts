/**
 * @file validation.ts
 * @module api/suppliers/validation
 *
 * @summary
 * Zod schemas for the supplier create and edit forms.
 *
 * @enterprise
 * - Field-level error messages are phrased for direct display in form helpers.
 * - Email is validated client-side to match backend @Email constraint; other fields have no format rules.
 * - Optional string fields transform empty strings to null so the backend receives a clean null, not "".
 */

import { z } from 'zod';

/**
 * Schema for the supplier create form.
 * Empty optional fields are coerced to null so the backend receives null rather than an empty string.
 */
export const createSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .trim(),
  contactName: z
    .string()
    .optional()
    .transform((v) => v || null),
  phone: z
    .string()
    .optional()
    .transform((v) => v || null),
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .transform((v) => v || null),
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
  supplierId: z.string().min(1, 'Supplier ID is required'),
  contactName: z.string().nullable().catch(null),
  phone: z.string().nullable().catch(null),
  email: z.string().email('Invalid email format').nullable().catch(null),
});

export type EditSupplierForm = z.infer<typeof editSupplierSchema>;
