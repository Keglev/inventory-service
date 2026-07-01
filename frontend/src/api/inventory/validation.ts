/**
 * @file validation.ts
 * @module api/inventory/validation
 *
 * @summary
 * Backward-compatibility re-export shim for inventory validation schemas.
 * All schema logic lives in pages/inventory/validation/inventoryValidation;
 * this module preserves existing import paths during migration.
 *
 * @deprecated Import directly from pages/inventory/validation/inventoryValidation instead.
 * This module will be removed in a future version.
 */

export {
  itemFormSchema,
  quantityAdjustSchema,
  priceChangeSchema,
  editItemSchema,
  deleteItemSchema,
  INCREASE_ADJUST_REASONS,
  DECREASE_ADJUST_REASONS,
  ADJUST_REASONS,
  type UpsertItemForm,
  type QuantityAdjustForm,
  type PriceChangeForm,
  type EditItemForm,
  type DeleteItemForm,
  type AdjustReason,
} from '../../pages/inventory/validation/inventoryValidation';
