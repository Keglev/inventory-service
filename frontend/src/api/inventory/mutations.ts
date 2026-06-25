/**
 * @module api/inventory/mutations
 *
 * Barrel facade for inventory write operations and supporting types.
 * Re-exports item lifecycle mutations from itemMutations, stock quantity adjustments
 * from stockMutations, price changes from priceMutations, supplier and item search
 * queries from supplierQueries, row normalization from normalizers, and request/response
 * types from types — providing a single stable import path that is decoupled from
 * the internal module split.
 */

// Item lifecycle mutations (create, update, rename, delete)
export {
  upsertItem,
  renameItem,
  deleteItem,
  INVENTORY_BASE,
} from './itemMutations';

// Stock adjustment mutations (quantity changes)
export { adjustQuantity } from './stockMutations';

// Price change mutations
export { changePrice } from './priceMutations';

// Supplier and item search queries
export {
  listSuppliers,
  searchItemsBySupplier,
  SUPPLIERS_BASE,
} from './supplierQueries';

// Data normalization utilities
export { normalizeInventoryRow } from './normalizers';

// Request/response types
export type {
  UpsertItemRequest,
  UpsertItemResponse,
  AdjustQuantityRequest,
  ChangePriceRequest,
} from './types';
