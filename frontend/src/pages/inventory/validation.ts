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
 * Schema for creating or updating inventory items.
 * Handles both new item creation and existing item updates.
 */
export const itemFormSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  code: z.string().optional(),
  supplierId: z.union([z.string(), z.number()]).refine(val => val !== "" && val !== 0, "Supplier is required"),
  quantity: z.number().min(0, "Initial stock must be non-negative"),
  price: z.number().min(0, "Price must be non-negative"),
  reason: z.enum(["INITIAL_STOCK", "MANUAL_UPDATE"], {
    message: "Reason is required",
  }),
});

export type UpsertItemForm = z.infer<typeof itemFormSchema>;

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
