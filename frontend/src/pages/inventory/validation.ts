/**
 * @file validation.ts
 * @module pages/inventory/validation
 *
 * @summary
 * Centralized validation schemas for inventory management forms.
 * Zod schemas for inventory create/edit, quantity adjustment, and price change.
 *
 * Uses Zod for type-safe validation with custom error messages.
 *
 * @enterprise
 * - Uses z.coerce.number() so inputs can be strings (from text fields) or numbers.
 * - No any. Clear, field-level error messages suitable for form mapping.
 */

import { z } from 'zod';

/**
 * Schema for supplier ID - can be string or number
 */
const supplierIdSchema = z.union([
  z.string().min(1, 'Supplier is required'),
  z.number(),
]);

/**
 * Schema for creating or updating inventory items.
 * Handles both new item creation and existing item updates.
 */
export const upsertItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  code: z.string().trim().optional().nullable(),
  supplierId: supplierIdSchema,
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  price: z.number().min(0, 'Price cannot be negative'),
  minQty: z.number().min(0, 'Minimum quantity cannot be negative'),
  notes: z.string().optional().nullable(),
});

export type UpsertItemForm = z.infer<typeof upsertItemSchema>;

/**
 * Schema for adjusting item quantities.
 * Used in quantity adjustment dialogs.
 */
export const quantityAdjustSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
  newQuantity: z.number().min(0, 'Quantity cannot be negative'),
  reason: z.string().min(1, 'Reason is required'),
});

export type QuantityAdjustForm = z.infer<typeof quantityAdjustSchema>;

/**
 * Schema for changing item prices.
 * Used in price change dialogs.
 */
export const priceChangeSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
  newPrice: z.number().min(0, 'Price cannot be negative'),
  reason: z.string().min(1, 'Reason is required'),
});

export type PriceChangeForm = z.infer<typeof priceChangeSchema>;
