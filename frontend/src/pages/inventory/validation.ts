/**
 * @file validation.ts
 * @module pages/inventory/validation
 *
 * @summary
 * Zod schemas for Inventory create/edit, quantity adjustment, and price change.
 *
 * @enterprise
 * - Uses z.coerce.number() so inputs can be strings (from text fields) or numbers.
 * - No `any`. Clear, field-level error messages suitable for form mapping.
 */

import { z } from 'zod';

/**
 * Supplier ID must be present and can be string or number.
 * Empty string is rejected with a clear message.
 */
const supplierIdSchema = z.union([
  z.string().min(1, 'Supplier is required'),
  z.number(),
]);

export const upsertItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  code: z.string().trim().optional().nullable(),
  supplierId: supplierIdSchema,
  price: z.coerce.number().positive('Price must be greater than 0'),
  minQty: z.coerce.number().nonnegative('Min qty must be ≥ 0').optional(),
  notes: z.string().optional().nullable(),
});

export const adjustQuantitySchema = z.object({
  id: z.string(),
  // Accept both "3" and 3; disallow 0
  delta: z.coerce
    .number()
    .refine((n) => Number.isFinite(n) && n !== 0, 'Quantity change cannot be 0'),
  reason: z.string().min(2, 'Reason is required'),
});

export const changePriceSchema = z.object({
  id: z.string(),
  price: z.coerce
    .number()
    .refine((n) => Number.isFinite(n) && n >= 0, 'Price must be ≥ 0'),
});

export type UpsertItemForm = z.infer<typeof upsertItemSchema>;
export type AdjustQuantityForm = z.infer<typeof adjustQuantitySchema>;
export type ChangePriceForm = z.infer<typeof changePriceSchema>;
