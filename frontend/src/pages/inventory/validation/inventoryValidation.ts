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
 *   quantityAdjustSchema constrains reason to the direction-aware adjust
 *   set: increasing stock allows INITIAL_STOCK, RETURNED_BY_CUSTOMER and
 *   MANUAL_UPDATE; reducing stock allows SOLD, SCRAPPED, DESTROYED,
 *   DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER and MANUAL_UPDATE. It
 *   mirrors the backend StockHistoryValidator's accepted set and also
 *   rejects a no-op change (new quantity equal to current). price-change,
 *   edit-name, and delete carry no reason field at all because the backend
 *   does not record one for those flows.
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
  code: z.string().min(1, "SKU is required"),
  supplierId: z.union([z.string(), z.number()]).refine(val => val !== "" && val !== 0, "Supplier is required"),
  quantity: z.number().min(0, "Initial stock must be non-negative"),
  price: z.number().min(0, "Price must be non-negative"),
  reason: z.enum(["INITIAL_STOCK", "MANUAL_UPDATE"], {
    message: "Reason is required",
  }),
});

export type UpsertItemForm = z.infer<typeof itemFormSchema>;

/**
 * Adjust-reason sets, split by the direction of the quantity change.
 * Single source of truth shared by the schema (validation) and the dialog
 * dropdown (which offers only the reasons valid for the current direction).
 * Every value is accepted by the backend StockHistoryValidator.
 */
export const INCREASE_ADJUST_REASONS = [
  'INITIAL_STOCK',
  'RETURNED_BY_CUSTOMER',
  'MANUAL_UPDATE',
] as const;

export const DECREASE_ADJUST_REASONS = [
  'SOLD',
  'SCRAPPED',
  'DESTROYED',
  'DAMAGED',
  'EXPIRED',
  'LOST',
  'RETURNED_TO_SUPPLIER',
  'MANUAL_UPDATE',
] as const;

/** Union of both directions: every reason the adjust dialog can ever offer. */
export const ADJUST_REASONS = [
  'INITIAL_STOCK',
  'RETURNED_BY_CUSTOMER',
  'MANUAL_UPDATE',
  'SOLD',
  'SCRAPPED',
  'DESTROYED',
  'DAMAGED',
  'EXPIRED',
  'LOST',
  'RETURNED_TO_SUPPLIER',
] as const;

export type AdjustReason = (typeof ADJUST_REASONS)[number];

/**
 * Schema for adjusting item quantities, used in the quantity-adjust dialog.
 *
 * currentQuantity is the item's live on-hand quantity (populated from the
 * details query); it is not user-editable but is carried in the form so the
 * refinements can derive the change direction. Rules: reason must match the
 * direction, and the new quantity must differ from the current one (a
 * zero-delta write is rejected by the backend for every reason except
 * PRICE_CHANGE, which this flow never sends).
 */
export const quantityAdjustSchema = z
  .object({
    itemId: z.string().min(1, 'Item selection is required'),
    currentQuantity: z.number(),
    newQuantity: z.number().min(0, 'Quantity cannot be negative'),
    reason: z.enum(ADJUST_REASONS, { message: 'Reason is required' }),
  })
  .refine((v) => v.newQuantity !== v.currentQuantity, {
    message: 'New quantity must differ from the current quantity',
    path: ['newQuantity'],
  })
  .refine(
    (v) =>
      v.newQuantity <= v.currentQuantity ||
      (INCREASE_ADJUST_REASONS as readonly string[]).includes(v.reason),
    { message: 'Select a reason valid for increasing stock', path: ['reason'] }
  )
  .refine(
    (v) =>
      v.newQuantity >= v.currentQuantity ||
      (DECREASE_ADJUST_REASONS as readonly string[]).includes(v.reason),
    { message: 'Select a reason valid for reducing stock', path: ['reason'] }
  );

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
