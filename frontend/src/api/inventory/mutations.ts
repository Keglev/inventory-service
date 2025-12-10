/**
 * @file mutations.ts
 * @module api/inventory/mutations
 *
 * @summary
 * Barrel export for inventory mutations and queries.
 * Provides unified interface for all inventory-related API operations:
 * item CRUD, stock adjustments, price changes, and supplier searches.
 *
 * @enterprise
 * - Single import location for all mutations and queries
 * - Backward compatible with existing imports
 * - Clear separation of concerns across modules
 * - Full TypeDoc documentation inheritance
 *
 * @usage
 * ```typescript
 * // Import specific mutations
 * import { upsertItem, adjustQuantity, changePrice } from '@/api/inventory/mutations';
 *
 * // Or import types
 * import type { UpsertItemRequest, AdjustQuantityRequest } from '@/api/inventory/mutations';
 *
 * // Or import suppliers
 * import { listSuppliers, searchItemsBySupplier } from '@/api/inventory/mutations';
 * ```
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
