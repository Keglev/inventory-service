/**
 * REFACTORING SUMMARY: mutations.ts Split
 * 
 * BEFORE:
 * - mutations.ts (monolithic file with 7 functions + 3 interfaces + 1 normalizer, ~350 lines)
 * 
 * AFTER:
 * - Organized into 4 focused modules + 1 barrel export + updated types
 * 
 * FILE STRUCTURE:
 * ├── itemMutations.ts (~90 lines)
 * │   ├── upsertItem() - Create/update items
 * │   ├── renameItem() - Rename items (ADMIN)
 * │   └── deleteItem() - Delete items (ADMIN, quantity must be 0)
 * │
 * ├── stockMutations.ts (~60 lines)
 * │   └── adjustQuantity() - Purchase/correction style adjustments
 * │
 * ├── priceMutations.ts (~60 lines)
 * │   └── changePrice() - Update item unit price
 * │
 * ├── supplierQueries.ts (~120 lines)
 * │   ├── listSuppliers() - Supplier list for dropdowns
 * │   └── searchItemsBySupplier() - Type-ahead item search
 * │
 * ├── normalizers.ts (~110 lines)
 * │   └── normalizeInventoryRow() - Backend response normalization
 * │
 * ├── types.ts (updated, now includes mutations types)
 * │   ├── UpsertItemRequest
 * │   ├── UpsertItemResponse
 * │   ├── AdjustQuantityRequest
 * │   └── ChangePriceRequest
 * │
 * └── mutations.ts (barrel export, ~50 lines)
 *     └── Unified export point for all mutations/queries
 * 
 * ENTERPRISE BENEFITS:
 * ✓ Single Responsibility Principle - each file has one concern
 * ✓ Stock management isolated from item CRUD
 * ✓ Price changes as separate concern
 * ✓ Supplier/search queries separated from mutations
 * ✓ Normalization logic extracted for reusability
 * ✓ Better code organization - easier to locate specific operations
 * ✓ Improved testability - focused testing per module
 * ✓ Complete TypeDoc documentation - full coverage maintained
 * ✓ Zero breaking changes - backward compatible barrel export
 * ✓ Better tree-shaking potential - unused functions won't be bundled
 * 
 * EXISTING IMPORTS:
 * All existing imports from '@/api/inventory/mutations' continue to work:
 * - import { upsertItem } from '@/api/inventory/mutations'
 * - import { renameItem } from '@/api/inventory/mutations'
 * - import { adjustQuantity } from '@/api/inventory/mutations'
 * - import { changePrice } from '@/api/inventory/mutations'
 * - import { deleteItem } from '@/api/inventory/mutations'
 * - import { listSuppliers, searchItemsBySupplier } from '@/api/inventory/mutations'
 * - import type { UpsertItemRequest } from '@/api/inventory/mutations'
 * 
 * No changes needed in consuming components!
 * 
 * CACHE STRATEGY APPLIED:
 * - Mutations: No caching (real-time updates)
 * - Supplier list: Called fresh each time (1000 item limit)
 * - Item search: Called fresh for each type-ahead
 */
