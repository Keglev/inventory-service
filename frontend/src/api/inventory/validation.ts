/**
 * @file validation.ts
 * @module api/inventory/validation
 *
 * @summary
 * Re-exports validation schemas from pages/inventory/validation.
 * Maintains backward compatibility while centralizing validation schemas.
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
  type UpsertItemForm,
  type QuantityAdjustForm,
  type PriceChangeForm,
  type EditItemForm,
  type DeleteItemForm,
} from '../../pages/inventory/validation/inventoryValidation';
