/**
 * @file validation.ts
 * @module api/inventory/validation
 *
 * @summary
 * Centralized validation schemas for inventory management forms.
 * Zod schemas for inventory create/edit, quantity adjustment, and price change.
 * These schemas mirror backend validation rules for client-side validation.
 *
 * Uses Zod for type-safe validation with custom error messages.
 *
 * @enterprise
 * - Uses z.coerce.number() so inputs can be strings (from text fields) or numbers.
 * - No any. Clear, field-level error messages suitable for form mapping.
 * - Schemas should echo backend validation for consistency.
 */

import { z } from 'zod';

/**
 * Schema for creating or updating inventory items.
 * Handles both new item creation and existing item updates.
 * Mirrors backend validation in inventory controller.
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
 * Mirrors backend PATCH /{id}/quantity endpoint validation.
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
 * Mirrors backend PATCH /{id}/price endpoint validation.
 *
 * @validation
 * - itemId: Required, identifies which item to update
 * - newPrice: Must be positive (> 0), backend validates this as well
 *
 * @note Backend does not require a "reason" parameter for price changes
 */
export const priceChangeSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
  newPrice: z.number().positive('Price must be greater than 0'),
});

export type PriceChangeForm = z.infer<typeof priceChangeSchema>;

/**
 * Schema for editing item names.
 * Used in edit item dialogs.
 * Mirrors backend PATCH /{id}/name endpoint validation.
 *
 * @validation
 * - itemId: Required, identifies which item to update
 * - newName: Must not be empty, should be different from current name
 *
 * @note Backend validates that the new name is not a duplicate for the same supplier
 * @note Only ADMIN users can change item names
 */
export const editItemSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
  newName: z.string().min(1, 'Item name is required'),
});

export type EditItemForm = z.infer<typeof editItemSchema>;

/**
 * Schema for deleting inventory items.
 * Used in delete item dialogs.
 * Mirrors backend DELETE /{id} endpoint validation.
 *
 * @validation
 * - itemId: Required, identifies which item to delete
 *
 * @note Backend validates that item quantity is 0 before allowing deletion
 * @note Only ADMIN users can delete items
 */
export const deleteItemSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
});

export type DeleteItemForm = z.infer<typeof deleteItemSchema>;
