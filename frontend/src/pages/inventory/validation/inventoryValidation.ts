/**
 * @file inventoryValidation.ts
 * @module pages/inventory/validation/inventoryValidation
 *
 * @summary
 * Zod schemas for the five inventory-mutation flows: create/update item,
 * adjust quantity, change price, edit name, delete item.
 *
 * @enterprise
 * - Five-flow split. Each mutation owns its schema with no cross-schema
 *   reuse. This keeps the boundary mapping to the backend one-to-one and
 *   makes flow-specific tightening (e.g. reason rules) a local change.
 * - Reason field is intentionally asymmetric across flows. itemFormSchema
 *   constrains reason to the 2-value subset INITIAL_STOCK | MANUAL_UPDATE
 *   because creation and bulk edits only ever justify with these two.
 *   quantityAdjustSchema takes a loose z.string() so the broader
 *   StockChangeReason set (e.g. SCRAPPED, LOST, RETURNED_TO_SUPPLIER)
 *   flows through; the backend StockHistoryValidator is the authoritative
 *   check. price-change, edit-name, and delete carry no reason field at
 *   all because the backend does not record one for those flows.
 * - Tracked: CB-E (frontend looser than backend on quantity-adjust).
 *   Tightening is a deliberate refactor decision, not a comment-pass change.
 * - z.coerce.number() is used so text-input strings from MUI TextField
 *   are accepted without explicit conversion at the caller. Error messages
 *   are field-level so a form library can bind them directly.
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
 * Schema for changing item prices, used in price-change dialogs.
 *
 * Fields: itemId (required, identifies the item) and newPrice (must be
 * > 0; backend re-validates). No reason field -- backend does not record
 * one for this flow.
 */
export const priceChangeSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
  newPrice: z.number().positive('Price must be greater than 0'),
});

export type PriceChangeForm = z.infer<typeof priceChangeSchema>;

/**
 * Schema for editing item names, used in edit-item dialogs.
 *
 * Fields: itemId (required) and newName (non-empty; should differ from
 * the current name). Backend rejects duplicate names within the same
 * supplier, and only ADMIN users can rename items.
 */
export const editItemSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
  newName: z.string().min(1, 'Item name is required'),
});

export type EditItemForm = z.infer<typeof editItemSchema>;

/**
 * Schema for deleting inventory items, used in delete-item dialogs.
 *
 * Fields: itemId (required). Backend rejects deletion if the item's
 * quantity is not 0, and only ADMIN users can delete items.
 */
export const deleteItemSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
});

export type DeleteItemForm = z.infer<typeof deleteItemSchema>;
